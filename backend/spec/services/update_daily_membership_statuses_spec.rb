# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UpdateDailyMembershipStatuses do
  let(:shop) { create_shop }
  let(:session_pkg) { Package.create!(shop: shop, name: '10 sessions', sessions_count: 10, price: 200_000) }
  let(:day_pkg) { Package.create!(shop: shop, name: '30 days', duration_days: 30, price: 300_000) }

  def create_member(package:, customer_name:, sessions_left: nil, expires_at: nil)
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: customer_name,
      phone: '0901234567',
      sessions_left: sessions_left,
      expires_at: expires_at
    )
  end

  describe '.call' do
    it 'updates status column for expired and expiring memberships in DB' do
      m_expired = create_member(package: day_pkg, customer_name: 'Exp', expires_at: Date.current - 2.days)
      m_expiring = create_member(package: session_pkg, customer_name: 'Few', sessions_left: 2)
      m_active = create_member(package: session_pkg, customer_name: 'Many', sessions_left: 8)

      # Manually set stale status to active in DB without triggering callbacks
      # rubocop:disable Rails/SkipsModelValidations
      m_expired.update_column(:status, 'active')
      m_expiring.update_column(:status, 'active')
      # rubocop:enable Rails/SkipsModelValidations

      described_class.call

      expect(m_expired.reload.read_attribute(:status)).to eq('expired')
      expect(m_expiring.reload.read_attribute(:status)).to eq('expiring')
      expect(m_active.reload.read_attribute(:status)).to eq('active')
    end

    it 'creates audit logs for memberships needing renewal' do
      m1 = create_member(package: session_pkg, customer_name: 'Nguyen Van A', sessions_left: 2)
      m2 = create_member(package: day_pkg, customer_name: 'Tran Thi B', expires_at: Date.current + 2.days)
      _m3 = create_member(package: session_pkg, customer_name: 'Le Van C', sessions_left: 8)

      expect do
        described_class.call
      end.to change(AuditLog, :count).by(2)

      logs = AuditLog.where(action: 'membership_renewal_needed')
      expect(logs.pluck(:target_id)).to contain_exactly(m1.id, m2.id)

      m1_log = logs.find_by(target_id: m1.id)
      expect(m1_log.details['customer_name']).to eq('Nguyen Van A')
      expect(m1_log.details['reason']).to include('Còn 2 buổi')

      m2_log = logs.find_by(target_id: m2.id)
      expect(m2_log.details['customer_name']).to eq('Tran Thi B')
      expect(m2_log.details['reason']).to include('Còn 2 ngày')
    end

    it 'is idempotent and does not create duplicate audit logs when run multiple times on the same day' do
      create_member(package: session_pkg, customer_name: 'Nguyen Van A', sessions_left: 2)

      expect do
        described_class.call
      end.to change(AuditLog, :count).by(1)

      # Second run on the same day should NOT add duplicate logs
      expect do
        described_class.call
      end.not_to change(AuditLog, :count)

      # Third run should still be a no-op for audit logs
      expect do
        described_class.call
      end.not_to change(AuditLog, :count)
    end
  end
end
