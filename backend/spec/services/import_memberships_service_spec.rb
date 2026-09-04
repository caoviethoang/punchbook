# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ImportMembershipsService do
  subject(:service) { described_class.new(shop: shop, file: file) }

  let(:shop) { create_shop(plan: 'paid') }
  let!(:package_session) do
    Package.create!(shop: shop, name: 'Gói 10 buổi', sessions_count: 10, price: 1_000_000)
  end
  let!(:package_day) do
    Package.create!(shop: shop, name: 'Gói 1 tháng', duration_days: 30, price: 500_000)
  end

  describe '#call' do
    context 'with valid XLSX file' do
      let(:file) do
        package = Axlsx::Package.new
        package.workbook.add_worksheet(name: 'Members') do |sheet|
          sheet.add_row ['Tên hội viên', 'Số điện thoại', 'Gói cước', 'Số buổi / Ngày hết hạn']
          sheet.add_row ['Nguyễn Văn A', '0901234567', 'Gói 10 buổi', '8']
          sheet.add_row ['Trần Thị B', '0912345678', 'Gói 1 tháng', '30/10/2026']
        end
        temp_file = Tempfile.new(['members', '.xlsx'])
        package.serialize(temp_file.path)
        ActionDispatch::Http::UploadedFile.new(
          filename: 'members.xlsx',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          tempfile: temp_file
        )
      end

      it 'imports all valid members and overrides values correctly' do
        expect do
          result = service.call
          expect(result.total_rows).to eq(2)
          expect(result.success_count).to eq(2)
          expect(result.failed_count).to eq(0)
          expect(result.errors).to be_empty
        end.to change(Membership, :count).by(2)

        member_a = shop.memberships.find_by(customer_name: 'Nguyễn Văn A')
        expect(member_a).to be_present
        expect(member_a.phone).to eq('0901234567')
        expect(member_a.package).to eq(package_session)
        expect(member_a.sessions_left).to eq(8)

        member_b = shop.memberships.find_by(customer_name: 'Trần Thị B')
        expect(member_b).to be_present
        expect(member_b.phone).to eq('0912345678')
        expect(member_b.package).to eq(package_day)
        expect(member_b.expires_at).to eq(Date.new(2026, 10, 30))
      end
    end

    context 'with CSV file' do
      let(:file) do
        temp_file = Tempfile.new(['members', '.csv'])
        temp_file.write("Tên hội viên,Số điện thoại,Gói cước,Số buổi\n")
        temp_file.write("Lê Văn C,0933333333,Gói 10 buổi,10\n")
        temp_file.rewind
        ActionDispatch::Http::UploadedFile.new(
          filename: 'members.csv',
          type: 'text/csv',
          tempfile: temp_file
        )
      end

      it 'imports members from CSV file' do
        expect do
          result = service.call
          expect(result.success_count).to eq(1)
        end.to change(Membership, :count).by(1)

        member = shop.memberships.find_by(customer_name: 'Lê Văn C')
        expect(member).to be_present
        expect(member.phone).to eq('0933333333')
      end
    end

    context 'with invalid data or missing packages' do
      let(:file) do
        package = Axlsx::Package.new
        package.workbook.add_worksheet(name: 'Members') do |sheet|
          sheet.add_row ['Tên hội viên', 'Số điện thoại', 'Gói cước', 'Số buổi']
          sheet.add_row ['', '0901234567', 'Gói 10 buổi', '10']
          sheet.add_row ['Nguyễn Văn X', '0909999999', 'Gói Không Tồn Tại', '5']
        end
        temp_file = Tempfile.new(['invalid', '.xlsx'])
        package.serialize(temp_file.path)
        ActionDispatch::Http::UploadedFile.new(
          filename: 'invalid.xlsx',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          tempfile: temp_file
        )
      end

      it 'returns row-level error reports' do
        result = service.call
        expect(result.total_rows).to eq(2)
        expect(result.success_count).to eq(0)
        expect(result.failed_count).to eq(2)
        expect(result.errors.size).to eq(2)

        expect(result.errors[0][:row]).to eq(2)
        expect(result.errors[0][:error]).to include('Tên hội viên không được để trống')

        expect(result.errors[1][:row]).to eq(3)
        expect(result.errors[1][:error]).to include("Gói cước 'Gói Không Tồn Tại' không tồn tại")
      end
    end

    context 'when free plan quota is reached' do
      it 'prevents import and returns quota exceeded error' do
        free_shop = create_shop(plan: 'free')
        free_pkg = Package.create!(shop: free_shop, name: 'Standard', sessions_count: 5, price: 100_000)
        file = build_test_xlsx(['Extra Member', '0999999999', 'Standard'])

        15.times do |i|
          Membership.create!(
            shop: free_shop, package: free_pkg,
            customer_name: "Customer #{i}", phone: "09000000#{i.to_s.rjust(2, '0')}"
          )
        end

        result = described_class.new(shop: free_shop, file: file).call

        expect(result.success_count).to eq(0)
        expect(result.errors.first[:error]).to include('Gói Free chỉ được tạo tối đa 15 hội viên')
      end
    end
  end

  def build_test_xlsx(row)
    package = Axlsx::Package.new
    package.workbook.add_worksheet(name: 'Members') do |sheet|
      sheet.add_row ['Tên hội viên', 'Số điện thoại', 'Gói cước']
      sheet.add_row row
    end
    temp_file = Tempfile.new(['limit', '.xlsx'])
    package.serialize(temp_file.path)
    ActionDispatch::Http::UploadedFile.new(
      filename: 'limit.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      tempfile: temp_file
    )
  end
end
