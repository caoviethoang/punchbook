# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FreezeMembership do
  include ActiveSupport::Testing::TimeHelpers

  let(:shop) { create_shop(max_freeze_days_per_year: 30) }
  let(:package) { Package.create!(shop: shop, name: 'Monthly', duration_days: 30, price: 500_000) }
  let(:membership) do
    Membership.create!(shop: shop, package: package, customer_name: 'Review', phone: '0901234567',
                       expires_at: Date.current + 90)
  end

  around { |example| travel_to(Time.zone.local(2026, 11, 2, 10)) { example.run } }

  def freeze_for(days)
    FreezeMembership.call(membership: membership, freeze_until: Date.current + days - 1)
  end

  it 'does not credit repeated immediate cancellations' do
    original_expiry = membership.expires_at
    3.times do
      freeze_for(7)
      UnfreezeMembership.call(membership: membership)
    end
    expect(membership.reload.expires_at).to eq(original_expiry)
  end

  it 'counts the inclusive end date against the maximum' do
    expect { freeze_for(31) }.to raise_error(FreezeMembership::InvalidFreezeDateError)
    expect { freeze_for(30) }.not_to raise_error
  end

  it 'rejects another hold after the annual allowance has been consumed' do
    freeze_for(30)
    travel 30.days
    UnfreezeMembership.call(membership: membership)
    expect { freeze_for(2) }.to raise_error(FreezeMembership::InvalidFreezeDateError)
  end

  it 'counts only consumed days when a hold ends early' do
    freeze_for(30)
    travel 5.days
    UnfreezeMembership.call(membership: membership)
    expect { freeze_for(26) }.to raise_error(FreezeMembership::InvalidFreezeDateError)
    expect { freeze_for(25) }.not_to raise_error
  end

  it 'allocates a cross-year hold to each calendar year' do
    shop.update!(max_freeze_days_per_year: 10)
    travel_to Time.zone.local(2026, 12, 27, 10)
    freeze_for(10)
    travel 10.days
    UnfreezeMembership.call(membership: membership)
    expect { freeze_for(6) }.to raise_error(FreezeMembership::InvalidFreezeDateError)
    expect { freeze_for(5) }.not_to raise_error
  end

  it 'includes legacy completed holds in the allowance' do
    AuditLog.log_membership_unfrozen!(
      shop: shop, staff: nil, membership: membership,
      days_extended: 29, new_expires_at: membership.expires_at
    )
    expect { freeze_for(2) }.to raise_error(FreezeMembership::InvalidFreezeDateError)
  end

  it 'keeps the membership frozen throughout its last day and extends it once afterward' do
    original_expiry = membership.expires_at
    freeze_for(7)
    travel 6.days
    UpdateDailyMembershipStatuses.call
    expect(membership.reload.frozen?).to be true

    travel 1.day
    UpdateDailyMembershipStatuses.call
    expect(membership.reload.frozen_at).to be_nil
    expect(membership.expires_at).to eq(original_expiry + 7)
    UpdateDailyMembershipStatuses.call
    expect(membership.reload.expires_at).to eq(original_expiry + 7)
  end

  it 'recovers an overdue hold after a profile update changed the cached status' do
    original_expiry = membership.expires_at
    freeze_for(7)
    travel 9.days
    membership.update!(notes: 'Profile edit')
    expect(membership.reload.status).not_to eq('frozen')
    expect { freeze_for(7) }.to raise_error(FreezeMembership::IneligibleMembershipError)
    UpdateDailyMembershipStatuses.call
    expect(membership.reload.frozen_at).to be_nil
    expect(membership.expires_at).to eq(original_expiry + 7)
  end
end
