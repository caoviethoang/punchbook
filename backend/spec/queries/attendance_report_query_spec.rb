# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AttendanceReportQuery do
  let(:shop) { create_shop(name: 'Gym Pro', plan: 'paid') }
  let(:package) { Package.create!(shop: shop, name: '30 Days Gym', duration_days: 30, price: 500_000) }

  def create_member(name, phone)
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: name,
      phone: phone,
      expires_at: Date.current + 20.days
    )
  end

  describe '.call' do
    let(:coach) do
      Staff.create!(shop: shop, name: 'Coach Tuan', username: 'coach1', password: 'password123', role: 'staff')
    end

    before do
      m_active = create_member('Nguyen Van A', '0901111111')
      m_moderate = create_member('Tran Thi B', '0902222222')
      m_inactive = create_member('Le Van C', '0903333333')

      CheckIn.create!(membership: m_active, staff: coach, checked_in_at: Time.zone.parse('2026-10-05 08:30:00'))
      CheckIn.create!(membership: m_active, staff: coach, checked_in_at: Time.zone.parse('2026-10-15 09:00:00'))
      CheckIn.create!(membership: m_active, staff: coach, checked_in_at: Time.zone.parse('2026-10-20 18:00:00'))

      CheckIn.create!(membership: m_moderate, staff: coach, checked_in_at: Time.zone.parse('2026-10-15 09:00:00'))
      CheckIn.create!(membership: m_inactive, staff: coach, checked_in_at: Time.zone.parse('2026-09-25 10:00:00'))
    end

    it 'returns correct monthly summary metrics' do
      result = described_class.call(shop, '2026-10')

      expect(result[:month]).to eq('2026-10')
      expect(result[:summary]).to eq(
        total_members: 3,
        active_members_count: 2,
        inactive_members_count: 1,
        total_check_ins: 4,
        avg_check_ins_per_active_member: 2.0
      )
    end

    it 'ranks members with check-ins and marks inactive members' do
      result = described_class.call(shop, '2026-10')
      top_member = result[:attendance].first
      expect(top_member).to include(customer_name: 'Nguyen Van A', check_ins_count: 3, rank: 1, is_inactive: false)

      inactive_member = result[:attendance].last
      expect(inactive_member).to include(customer_name: 'Le Van C', check_ins_count: 0, rank: nil, is_inactive: true)
    end

    it 'defaults to current month if month string is omitted or invalid' do
      result = described_class.call(shop, 'invalid-date')
      expect(result[:month]).to eq(Time.zone.today.strftime('%Y-%m'))
    end

    it 'does not leak members or check-ins from other shops' do
      other_shop = create_shop(name: 'Other Shop', email: 'other@example.com')
      other_pkg = Package.create!(shop: other_shop, name: 'Other Pkg', sessions_count: 5, price: 100_000)
      other_member = Membership.create!(shop: other_shop, package: other_pkg, customer_name: 'Outsider', phone: '090')

      result = described_class.call(shop, '2026-10')
      member_ids = result[:attendance].pluck(:membership_id)
      expect(member_ids).not_to include(other_member.id)
    end
  end
end
