# frozen_string_literal: true

require 'rails_helper'
require 'roo'

RSpec.describe ExportMembershipsService do
  let(:shop) { create_shop }

  before do
    seed_memberships(shop)
  end

  def seed_memberships(target_shop)
    session_pkg = Package.create!(shop: target_shop, name: 'Gói 10 buổi', sessions_count: 10, price: 500_000)
    day_pkg = Package.create!(shop: target_shop, name: 'Gói 30 ngày', duration_days: 30, price: 600_000)

    Membership.create!(
      shop: target_shop, package: session_pkg, customer_name: 'Nguyen Van A', phone: '0901234567', sessions_left: 8
    )
    Membership.create!(
      shop: target_shop, package: session_pkg, customer_name: 'Tran Thi B', phone: '0912345678', sessions_left: 2
    )
    Membership.create!(
      shop: target_shop, package: day_pkg, customer_name: 'Le Van C', phone: '0987654321', expires_at: Date.yesterday
    )

    seed_other_shop_membership
  end

  def seed_other_shop_membership
    other_shop = create_shop(email: 'other@example.com')
    other_pkg = Package.create!(shop: other_shop, name: 'Other Pkg', sessions_count: 5, price: 200_000)
    Membership.create!(
      shop: other_shop, package: other_pkg, customer_name: 'Secret Member', phone: '0999999999', sessions_left: 5
    )
  end

  def parse_xlsx(binary_data)
    Roo::Excelx.new(StringIO.new(binary_data))
  end

  describe '#call' do
    it 'generates a valid XLSX file with expected headers and rows' do
      xlsx = parse_xlsx(described_class.call(shop: shop))
      sheet = xlsx.sheet(0)

      expect(sheet.row(1)).to eq(
        ['Tên hội viên', 'SĐT', 'Gói cước', 'Số buổi còn lại', 'Ngày hết hạn', 'Trạng thái']
      )

      names = (2..sheet.last_row).map { |r| sheet.cell(r, 1) }
      expect(names).to contain_exactly('Nguyen Van A', 'Tran Thi B', 'Le Van C')
      expect(names).not_to include('Secret Member')
    end

    it 'correctly formats session-based and day-based fields' do
      xlsx = parse_xlsx(described_class.call(shop: shop))
      sheet = xlsx.sheet(0)

      rows = (2..sheet.last_row).map { |r| sheet.row(r) }
      a_row = rows.find { |r| r[0] == 'Nguyen Van A' }
      c_row = rows.find { |r| r[0] == 'Le Van C' }

      expect(a_row).to eq(
        ['Nguyen Van A', '0901234567', 'Gói 10 buổi', 8, 'Không giới hạn', 'Đang hoạt động']
      )

      expect(c_row).to eq(
        ['Le Van C', '0987654321', 'Gói 30 ngày', 'Theo ngày', Date.yesterday.strftime('%d/%m/%Y'), 'Đã hết hạn']
      )
    end

    it 'returns only active memberships when status is active' do
      xlsx = parse_xlsx(described_class.call(shop: shop, status: 'active'))
      sheet = xlsx.sheet(0)
      names = (2..sheet.last_row).map { |r| sheet.cell(r, 1) }

      expect(names).to contain_exactly('Nguyen Van A')
    end

    it 'returns only expiring memberships when status is expiring' do
      xlsx = parse_xlsx(described_class.call(shop: shop, status: 'expiring'))
      sheet = xlsx.sheet(0)
      names = (2..sheet.last_row).map { |r| sheet.cell(r, 1) }

      expect(names).to contain_exactly('Tran Thi B')
    end

    it 'returns only expired memberships when status is expired' do
      xlsx = parse_xlsx(described_class.call(shop: shop, status: 'expired'))
      sheet = xlsx.sheet(0)
      names = (2..sheet.last_row).map { |r| sheet.cell(r, 1) }

      expect(names).to contain_exactly('Le Van C')
    end

    it 'supports Vietnamese status alias dang_hoat_dong' do
      xlsx = parse_xlsx(described_class.call(shop: shop, status: 'dang_hoat_dong'))
      sheet = xlsx.sheet(0)
      names = (2..sheet.last_row).map { |r| sheet.cell(r, 1) }

      expect(names).to contain_exactly('Nguyen Van A')
    end

    it 'filters memberships by name or phone query' do
      xlsx_name = parse_xlsx(described_class.call(shop: shop, query: 'Tran'))
      names_query = (2..xlsx_name.sheet(0).last_row).map { |r| xlsx_name.sheet(0).cell(r, 1) }
      expect(names_query).to contain_exactly('Tran Thi B')

      xlsx_phone = parse_xlsx(described_class.call(shop: shop, query: '0987654321'))
      phone_query = (2..xlsx_phone.sheet(0).last_row).map { |r| xlsx_phone.sheet(0).cell(r, 1) }
      expect(phone_query).to contain_exactly('Le Van C')
    end
  end
end
