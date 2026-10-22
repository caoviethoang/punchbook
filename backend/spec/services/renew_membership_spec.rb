# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RenewMembership do
  let(:shop) { Shop.create!(name: 'Punch Fitness', email: 'fitness@example.com', password: 'password123') }
  let(:staff) { Staff.create!(shop: shop, name: 'Coach Hung', role: 'staff') }
  let(:package_sessions) { Package.create!(shop: shop, name: 'Gói 10 buổi', sessions_count: 10, price: 1_000_000) }
  let(:package_days) { Package.create!(shop: shop, name: 'Gói 30 ngày', duration_days: 30, price: 800_000) }

  def create_member(package, sessions_left = nil, expires_at = nil)
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'Nguyen Van A',
      phone: '0901234567',
      sessions_left: sessions_left,
      expires_at: expires_at
    )
  end

  it 'renews session-based membership with existing package and logs audit and invoice' do
    member = create_member(package_sessions, 0)

    result = described_class.call(membership: member, staff: staff)

    expect(result[:membership].sessions_left).to eq(10)
    expect(result[:invoice].status).to eq('paid')
    expect(result[:invoice].amount).to eq(1_000_000)
    expect(result[:check_in]).to be_nil

    audit = AuditLog.where(target_id: member.id, action: 'membership_renewed').last
    expect(audit).to be_present
    expect(audit.details['sessions_after']).to eq(10)
  end

  it 'renews with auto_check_in true and performs immediate check-in' do
    member = create_member(package_sessions, 0)

    result = described_class.call(membership: member, staff: staff, auto_check_in: true)

    expect(result[:membership].sessions_left).to eq(9) # 10 renewed - 1 checked in
    expect(result[:check_in]).to be_present
    expect(result[:check_in].membership_id).to eq(member.id)
  end

  it 'renews with a different package' do
    member = create_member(package_sessions, 0)

    result = described_class.call(
      membership: member,
      package: package_days,
      staff: staff
    )

    expect(result[:membership].package_id).to eq(package_days.id)
    expect(result[:membership].sessions_left).to be_nil
    expect(result[:membership].expires_at).to eq(Date.current + 30.days)
  end

  it 'rejects package from another shop' do
    other_shop = Shop.create!(name: 'Other Shop', email: 'other@example.com', password: 'password123')
    other_package = Package.create!(shop: other_shop, name: 'Other', sessions_count: 5, price: 500_000)
    member = create_member(package_sessions, 0)

    expect do
      described_class.call(membership: member, package: other_package, staff: staff)
    end.to raise_error(RenewMembership::InvalidPackageError)
  end
end
