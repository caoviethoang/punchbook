# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UnfreezeMembership do
  include ActiveSupport::Testing::TimeHelpers

  let(:shop) { create_shop(name: 'Punch Fitness', max_freeze_days_per_year: 30) }
  let(:staff) { Staff.create!(shop: shop, name: 'Coach Alex', role: 'staff') }
  let(:package) { Package.create!(shop: shop, name: 'Monthly Pass', duration_days: 30, price: 500_000) }
  let(:initial_expiry) { 20.days.from_now.to_date }
  let(:membership) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'David Tran',
      phone: '0901234567',
      expires_at: initial_expiry
    )
  end

  before do
    FreezeMembership.call(
      membership: membership,
      staff: staff,
      freeze_until: 10.days.from_now.to_date,
      reason: 'Holiday'
    )
  end

  describe '.call' do
    it 'unfreezes the membership, clears freeze fields, and restores active status' do
      result = described_class.call(membership: membership, staff: staff, reason: 'Returned early')

      expect(result.status).to eq('active')
      expect(result.frozen?).to be false
      expect(result.frozen_at).to be_nil
      expect(result.frozen_until).to be_nil
      expect(result.freeze_reason).to be_nil
    end

    it 'extends expires_at by the frozen days for day-based packages' do
      # Simulate unfreezing 5 days after freeze start
      travel_to 5.days.from_now do
        described_class.call(membership: membership, staff: staff)
        expect(membership.reload.expires_at).to eq(initial_expiry + 5.days)
      end
    end

    it 'creates an audit log entry for unfreeze' do
      expect do
        described_class.call(membership: membership, staff: staff, reason: 'Back from trip')
      end.to change(AuditLog, :count).by(1)

      log = AuditLog.where(action: 'membership_unfrozen').last
      expect(log).to be_present
      expect(log.staff).to eq(staff)
      expect(log.details['customer_name']).to eq('David Tran')
    end

    it 'raises error if membership is not frozen' do
      described_class.call(membership: membership, staff: staff)

      expect do
        described_class.call(membership: membership, staff: staff)
      end.to raise_error(UnfreezeMembership::NotFrozenError)
    end
  end
end
