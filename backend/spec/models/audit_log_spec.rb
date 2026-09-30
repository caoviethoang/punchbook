# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AuditLog, type: :model do
  let(:shop) { create_shop(name: 'Gym Center', email: 'owner@gym.com') }
  let(:staff) { Staff.create!(shop: shop, name: 'Staff John', role: 'staff') }

  describe 'validations' do
    it 'requires action' do
      log = described_class.new(shop: shop, action: '')
      expect(log).not_to be_valid
      expect(log.errors[:action]).to be_present
    end

    it 'requires shop' do
      log = described_class.new(action: 'check_in')
      expect(log).not_to be_valid
      expect(log.errors[:shop]).to be_present
    end
  end

  describe 'associations' do
    it 'belongs to shop and optionally staff' do
      log = described_class.create!(shop: shop, staff: staff, action: 'check_in')
      expect(log.shop).to eq(shop)
      expect(log.staff).to eq(staff)
    end
  end

  describe 'factory methods' do
    let(:package) { Package.create!(shop: shop, name: 'Basic Package', price: 100_000, sessions_count: 10) }
    let(:membership) do
      Membership.create!(
        shop: shop,
        package: package,
        customer_name: 'Alice',
        phone: '0901234567',
        sessions_left: 10,
        expires_at: 30.days.from_now
      )
    end

    describe '.log_check_in!' do
      it 'creates an audit log entry for check in' do
        now = Time.current
        expect do
          described_class.log_check_in!(shop: shop, staff: staff, membership: membership, checked_in_at: now)
        end.to change(described_class, :count).by(1)

        log = described_class.last
        expect(log.shop).to eq(shop)
        expect(log.staff).to eq(staff)
        expect(log.action).to eq('check_in')
        expect(log.target_type).to eq('Membership')
        expect(log.target_id).to eq(membership.id)
        expect(log.details['membership_name']).to eq('Alice')
        expect(log.details['package_name']).to eq('Basic Package')
      end
    end

    describe '.log_membership_created!' do
      it 'creates an audit log entry for membership creation' do
        expect do
          described_class.log_membership_created!(shop: shop, staff: staff, membership: membership)
        end.to change(described_class, :count).by(1)

        log = described_class.last
        expect(log.action).to eq('membership_created')
        expect(log.details['customer_name']).to eq('Alice')
        expect(log.details['phone']).to eq('0901234567')
      end
    end

    describe '.log_membership_renewed!' do
      it 'creates an audit log entry for membership renewal' do
        expect do
          described_class.log_membership_renewed!(
            shop: shop,
            staff: staff,
            membership: membership,
            sessions_before: 0,
            expires_at_before: 1.day.ago
          )
        end.to change(described_class, :count).by(1)

        log = described_class.last
        expect(log.action).to eq('membership_renewed')
        expect(log.details['sessions_before']).to eq(0)
        expect(log.details['sessions_after']).to eq(10)
      end
    end
  end
end
