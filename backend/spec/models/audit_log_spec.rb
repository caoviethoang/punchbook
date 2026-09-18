# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AuditLog, type: :model do
  let(:shop) { create_shop }
  let!(:staff) { Staff.create!(shop: shop, name: 'Test Staff', role: 'cashier') }
  let!(:package) { Package.create!(shop: shop, name: '10 sessions', sessions_count: 10, price: 500_000) }
  let!(:membership) { Membership.create!(shop: shop, package: package, customer_name: 'Test Member', phone: '0901234567', sessions_left: 10) }

  describe 'validations' do
    it 'requires action' do
      log = AuditLog.new(shop: shop, action: nil)
      expect(log).not_to be_valid
      expect(log.errors[:action]).to include('can\'t be blank')
    end

    it 'requires shop' do
      log = AuditLog.new(action: 'check_in')
      expect(log).not_to be_valid
      expect(log.errors[:shop]).to include('must exist')
    end
  end

  describe '.log_check_in!' do
    it 'creates an audit log with correct details' do
      log = AuditLog.log_check_in!(
        shop: shop,
        staff: staff,
        membership: membership,
        checked_in_at: Time.utc(2026, 9, 5, 10, 30, 0)
      )

      expect(log.action).to eq('check_in')
      expect(log.shop).to eq(shop)
      expect(log.staff).to eq(staff)
      expect(log.target_type).to eq('Membership')
      expect(log.target_id).to eq(membership.id)
      expect(log.details['membership_name']).to eq('Test Member')
      expect(log.details['package_name']).to eq('10 sessions')
      expect(log.details['checked_in_at']).to eq('2026-09-05T10:30:00Z')
    end
  end

  describe '.log_membership_created!' do
    it 'creates an audit log with membership details' do
      log = AuditLog.log_membership_created!(
        shop: shop,
        staff: staff,
        membership: membership
      )

      expect(log.action).to eq('membership_created')
      expect(log.details['customer_name']).to eq('Test Member')
      expect(log.details['phone']).to eq('0901234567')
      expect(log.details['package_name']).to eq('10 sessions')
    end
  end

  describe '.log_membership_renewed!' do
    it 'creates an audit log with before/after values' do
      log = AuditLog.log_membership_renewed!(
        shop: shop,
        staff: staff,
        membership: membership,
        sessions_before: 10,
        expires_at_before: Date.current + 30.days
      )

      expect(log.action).to eq('membership_renewed')
      expect(log.details['sessions_before']).to eq(10)
      expect(log.details['expires_at_before']).to eq((Date.current + 30.days).iso8601)
    end
  end

  describe 'scopes' do
    it 'filters by action' do
      AuditLog.log_check_in!(shop: shop, staff: staff, membership: membership, checked_in_at: Time.current)
      result = AuditLog.by_action('check_in')
      expect(result.count).to eq(1)
    end

    it 'filters by staff' do
      AuditLog.log_check_in!(shop: shop, staff: staff, membership: membership, checked_in_at: Time.current)
      result = AuditLog.by_staff(staff.id)
      expect(result.count).to eq(1)
    end

    it 'orders by created_at desc' do
      first = AuditLog.log_check_in!(shop: shop, staff: staff, membership: membership, checked_in_at: 2.days.ago)
      second = AuditLog.log_check_in!(shop: shop, staff: staff, membership: membership, checked_in_at: 1.day.ago)
      result = AuditLog.recent
      expect(result.first).to eq(second)
      expect(result.last).to eq(first)
    end
  end
end
