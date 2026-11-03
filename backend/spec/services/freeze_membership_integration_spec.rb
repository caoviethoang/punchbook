# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FreezeMembership do
  include ActiveSupport::Testing::TimeHelpers

  let(:shop) { create_shop(plan: 'paid') }
  let(:staff) { Staff.create!(shop: shop, name: 'Reviewer', role: 'staff') }
  let(:package) { Package.create!(shop: shop, name: 'Monthly', duration_days: 30, price: 500_000) }

  def member(expiry)
    Membership.create!(shop: shop, package: package, customer_name: 'Review', phone: '0901234567', expires_at: expiry)
  end

  around { |example| travel_to(Time.zone.local(2026, 11, 3, 10)) { example.run } }

  it 'rejects a membership that expired before the daily status job ran' do
    membership = member(Date.current)
    travel_to Time.zone.local(2026, 11, 4, 6)
    expect(membership.reload.status).to eq('expiring')
    expect do
      described_class.call(membership: membership, freeze_until: Date.current + 5)
    end.to raise_error(FreezeMembership::IneligibleMembershipError)
  end

  it 'excludes frozen memberships from automated renewal reminders' do
    membership = member(Date.current + 2)
    described_class.call(membership: membership, freeze_until: Date.current + 14)
    expect(Membership.needing_reminder).not_to include(membership)
  end

  it 'does not over-credit time when renewing during a hold after the original expiry' do
    membership = member(Date.current + 2)
    original_expiry = membership.expires_at
    described_class.call(membership: membership, freeze_until: Date.current + 10)
    travel 5.days
    RenewMembership.call(membership: membership, staff: staff)
    UnfreezeMembership.call(membership: membership, staff: staff)
    expect(membership.reload.expires_at).to eq(original_expiry + 30 + 5)
  end

  it 'uses the freeze-aware renewal base for webhook renewals' do
    membership = member(Date.current + 2)
    original_expiry = membership.expires_at
    described_class.call(membership: membership, freeze_until: Date.current + 10)
    travel 5.days
    membership.renew!
    UnfreezeMembership.call(membership: membership, staff: staff)
    expect(membership.reload.expires_at).to eq(original_expiry + 35)
  end

  it 'does not credit time before switching from sessions to a day package' do
    session_package = Package.create!(shop: shop, name: 'Sessions', sessions_count: 10, price: 100_000)
    membership = Membership.create!(shop: shop, package: session_package, customer_name: 'Review',
                                    phone: '0901234567', sessions_left: 5)
    described_class.call(membership: membership, freeze_until: Date.current + 10)
    travel 5.days
    renewal_date = Date.current
    RenewMembership.call(membership: membership, staff: staff, package: package)
    UnfreezeMembership.call(membership: membership, staff: staff)
    expect(membership.reload.expires_at).to eq(renewal_date + 30)
  end

  it 'does not double-credit time after multiple renewals during a hold' do
    membership = member(Date.current + 2)
    original_expiry = membership.expires_at
    described_class.call(membership: membership, freeze_until: Date.current + 10)
    travel 5.days
    2.times { RenewMembership.call(membership: membership, staff: staff) }
    travel 2.days
    UnfreezeMembership.call(membership: membership, staff: staff)
    expect(membership.reload.expires_at).to eq(original_expiry + 67)
  end

  it 'suppresses overdue holds even after a profile edit changes their status' do
    membership = member(Date.current + 20)
    described_class.call(membership: membership, freeze_until: Date.current + 14)
    travel 15.days
    membership.update!(notes: 'Profile edit')
    expect(Membership.needing_reminder).not_to include(membership)
    UnfreezeMembership.call(membership: membership)
    travel 15.days
    expect(Membership.needing_reminder).to include(membership)
  end

  it 'excludes frozen members from dashboard renewal warnings' do
    membership = member(Date.current + 2)
    described_class.call(membership: membership, freeze_until: Date.current + 14)
    expect(ExpiringMembershipsQuery.call).not_to include(membership)
  end
end
