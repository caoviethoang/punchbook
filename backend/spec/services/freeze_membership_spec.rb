# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FreezeMembership do
  let(:shop) { create_shop(name: 'Punch Fitness', max_freeze_days_per_year: 30) }
  let(:staff) { Staff.create!(shop: shop, name: 'Coach Alex', role: 'staff') }
  let(:package) { Package.create!(shop: shop, name: 'Monthly Pass', duration_days: 30, price: 500_000) }
  let(:membership) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'David Tran',
      phone: '0901234567',
      expires_at: 20.days.from_now.to_date
    )
  end

  describe '.call' do
    context 'with valid parameters' do
      let(:freeze_until) { 10.days.from_now.to_date }

      it 'freezes the membership and records freeze details' do
        result = described_class.call(
          membership: membership,
          staff: staff,
          freeze_until: freeze_until,
          reason: 'Travelling abroad'
        )

        expect(result.status).to eq('frozen')
        expect(result.frozen?).to be true
        expect(result.frozen_until).to eq(freeze_until)
        expect(result.freeze_reason).to eq('Travelling abroad')
        expect(result.frozen_at).to be_within(2.seconds).of(Time.current)
      end

      it 'creates an audit log entry' do
        expect do
          described_class.call(
            membership: membership,
            staff: staff,
            freeze_until: freeze_until,
            reason: 'Injury recovery'
          )
        end.to change(AuditLog, :count).by(1)

        log = AuditLog.where(action: 'membership_frozen').last
        expect(log).to be_present
        expect(log.staff).to eq(staff)
        expect(log.details['frozen_until']).to eq(freeze_until.to_s)
        expect(log.details['reason']).to eq('Injury recovery')
      end
    end

    context 'with invalid parameters' do
      it 'raises error if freeze_until is today or in the past' do
        expect do
          described_class.call(
            membership: membership,
            staff: staff,
            freeze_until: Date.current
          )
        end.to raise_error(FreezeMembership::InvalidFreezeDateError)
      end

      it 'raises error if freeze duration exceeds shop limit' do
        expect do
          described_class.call(
            membership: membership,
            staff: staff,
            freeze_until: 40.days.from_now.to_date
          )
        end.to raise_error(FreezeMembership::InvalidFreezeDateError)
      end

      it 'raises error if membership is already frozen' do
        described_class.call(
          membership: membership,
          staff: staff,
          freeze_until: 5.days.from_now.to_date
        )

        expect do
          described_class.call(
            membership: membership,
            staff: staff,
            freeze_until: 10.days.from_now.to_date
          )
        end.to raise_error(FreezeMembership::IneligibleMembershipError)
      end

      it 'raises error if membership is expired' do
        membership.update!(expires_at: 1.day.ago.to_date, status: 'expired')

        expect do
          described_class.call(
            membership: membership,
            staff: staff,
            freeze_until: 5.days.from_now.to_date
          )
        end.to raise_error(FreezeMembership::IneligibleMembershipError)
      end
    end
  end
end
