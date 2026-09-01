# frozen_string_literal: true

require 'rails_helper'
require 'caxlsx'

RSpec.describe ImportMemberships do
  let(:shop) { create_shop(name: 'Lan Spa', plan: 'paid') }
  let!(:session_package) do
    Package.create!(shop: shop, name: 'Gói 10 Buổi', sessions_count: 10, price: 500_000)
  end
  let!(:day_package) do
    Package.create!(shop: shop, name: 'Gói 1 Tháng', duration_days: 30, price: 800_000)
  end

  def build_csv_tempfile(rows)
    file = Tempfile.new(['test_import', '.csv'])
    CSV.open(file.path, 'w') do |csv|
      rows.each { |r| csv << r }
    end
    file
  end

  def build_xlsx_tempfile(rows)
    file = Tempfile.new(['test_import', '.xlsx'])
    package = Axlsx::Package.new
    package.workbook.add_worksheet(name: 'Sheet1') do |sheet|
      rows.each { |r| sheet.add_row r }
    end
    package.serialize(file.path)
    file
  end

  describe '#call' do
    context 'with valid CSV file' do
      let(:valid_csv) do
        build_csv_tempfile([
                             ['Tên hội viên', 'Số điện thoại', 'Gói cước', 'Số buổi còn lại', 'Ngày hết hạn'],
                             ['Nguyễn Văn A', '0901234567', 'Gói 10 Buổi', '8', ''],
                             ['Trần Thị B', '0912345678', 'Gói 1 Tháng', '', '31/12/2026'],
                             ['Lê Văn C', '0987654321', 'Gói 10 Buổi', '', '']
                           ])
      end

      after do
        valid_csv.close
        valid_csv.unlink
      end

      it 'imports session-based and day-based memberships' do
        result = described_class.call(shop: shop, file: valid_csv.path)

        expect(result[:success]).to be true
        expect(result[:total_rows]).to eq(3)
        expect(result[:success_count]).to eq(3)
        expect(shop.memberships.find_by(phone: '0901234567')).to have_attributes(
          customer_name: 'Nguyễn Văn A', package: session_package, sessions_left: 8
        )
        expect(shop.memberships.find_by(phone: '0912345678')).to have_attributes(
          customer_name: 'Trần Thị B', package: day_package, expires_at: Date.new(2026, 12, 31)
        )
        expect(shop.memberships.find_by(phone: '0987654321').sessions_left).to eq(10)
      end
    end

    context 'with valid XLSX file' do
      it 'imports memberships from Excel' do
        xlsx_file = build_xlsx_tempfile([
                                          ['Tên hội viên', 'Số điện thoại', 'Gói cước', 'Số buổi còn lại',
                                           'Ngày hết hạn'],
                                          ['Phạm Thị D', '0933334444', 'Gói 10 Buổi', 5, ''],
                                          ['Hoàng Văn E', '0944445555', 'Gói 1 Tháng', '',
                                           (Date.current + 15.days).strftime('%Y-%m-%d')]
                                        ])

        result = described_class.call(shop: shop, file: xlsx_file.path)

        expect(result[:success]).to be true
        expect(result[:success_count]).to eq(2)
        expect(shop.memberships.count).to eq(2)

        member_d = shop.memberships.find_by(phone: '0933334444')
        expect(member_d.sessions_left).to eq(5)

        xlsx_file.close
        xlsx_file.unlink
      end
    end

    context 'with phone normalization' do
      it 'normalizes 9-digit phones and +84 prefix' do
        csv_file = build_csv_tempfile([
                                        ['Tên hội viên', 'Số điện thoại', 'Gói cước', 'Số buổi còn lại',
                                         'Ngày hết hạn'],
                                        ['Khách 1', '901234567', 'Gói 10 Buổi', '', ''],
                                        ['Khách 2', '+84912345678', 'Gói 10 Buổi', '', '']
                                      ])

        result = described_class.call(shop: shop, file: csv_file.path)

        expect(result[:success_count]).to eq(2)
        expect(shop.memberships.pluck(:phone)).to contain_exactly('0901234567', '0912345678')

        csv_file.close
        csv_file.unlink
      end
    end

    context 'with invalid rows' do
      let(:invalid_csv) do
        build_csv_tempfile([
                             ['Tên hội viên', 'Số điện thoại', 'Gói cước', 'Số buổi còn lại', 'Ngày hết hạn'],
                             ['Khách Hợp Lệ', '0901111111', 'Gói 10 Buổi', 10, ''],
                             ['', '0902222222', 'Gói 10 Buổi', 10, ''],
                             ['Khách Thiếu SĐT', '', 'Gói 10 Buổi', 10, ''],
                             ['Khách SĐT Sai', '123', 'Gói 10 Buổi', 10, ''],
                             ['Khách Gói Lạ', '0903333333', 'Gói Không Có', 10, ''],
                             ['Khách Buổi Sai', '0904444444', 'Gói 10 Buổi', 'abc', ''],
                             ['Khách Ngày Sai', '0905555555', 'Gói 1 Tháng', '', 'invalid-date']
                           ])
      end

      after do
        invalid_csv.close
        invalid_csv.unlink
      end

      it 'returns detailed error reporting for each failing row while saving valid rows' do
        result = described_class.call(shop: shop, file: invalid_csv.path)

        expect(result[:success]).to be false
        expect(result[:total_rows]).to eq(7)
        expect(result[:success_count]).to eq(1)
        expect(result[:error_count]).to eq(6)
        expect(result[:errors].pluck(:row)).to eq([3, 4, 5, 6, 7, 8])
        expect(result[:errors][0][:message]).to include('Tên hội viên không được để trống')
        expect(result[:errors][3][:message]).to include('không tồn tại trong hệ thống')
        expect(shop.memberships.count).to eq(1)
      end
    end

    context 'with invalid file headers' do
      it 'returns an error if required headers are missing' do
        csv_file = build_csv_tempfile([
                                        %w[Col1 Col2 Col3],
                                        %w[A B C]
                                      ])

        result = described_class.call(shop: shop, file: csv_file.path)

        expect(result[:success]).to be false
        expect(result[:error_count]).to eq(1)
        expect(result[:errors].first[:message]).to include('File không đúng định dạng')

        csv_file.close
        csv_file.unlink
      end
    end

    context 'when enforcing free plan limits' do
      let(:free_shop) { create_shop(name: 'Free Spa', plan: 'free') }
      let!(:free_package) { Package.create!(shop: free_shop, name: 'Gói Free', sessions_count: 5, price: 100_000) }

      it 'blocks creation after reaching 15 memberships' do
        13.times do |i|
          Membership.create!(
            shop: free_shop,
            package: free_package,
            customer_name: "Member #{i + 1}",
            phone: "09000000#{i.to_s.rjust(2, '0')}",
            sessions_left: 5
          )
        end

        csv_file = build_csv_tempfile([
                                        ['Tên hội viên', 'Số điện thoại', 'Gói cước', 'Số buổi còn lại',
                                         'Ngày hết hạn'],
                                        ['Member 14', '0900000014', 'Gói Free', 5, ''],
                                        ['Member 15', '0900000015', 'Gói Free', 5, ''],
                                        ['Member 16', '0900000016', 'Gói Free', 5, '']
                                      ])

        result = described_class.call(shop: free_shop, file: csv_file.path)

        expect(result[:success_count]).to eq(2)
        expect(result[:error_count]).to eq(1)
        expect(result[:errors].first[:message]).to include('Gói Free chỉ được tạo tối đa 15 hội viên')
        expect(free_shop.memberships.count).to eq(15)

        csv_file.close
        csv_file.unlink
      end
    end
  end
end
