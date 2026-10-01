# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FetchAuditLogsQuery do
  let!(:shop) do
    Shop.create!(
      name: 'Gym Audit Test',
      email: 'audit@test.com',
      password: 'password123',
      phone: '0909999999'
    )
  end

  let!(:staff) do
    shop.staffs.create!(
      name: 'Admin Staff',
      role: 'admin',
      username: 'admin_audit',
      password: 'password123'
    )
  end

  describe '.call' do
    it 'returns combined audit log entries formatted correctly' do
      shop.audit_logs.create!(
        staff: staff,
        action: 'check_in',
        target_type: 'Membership',
        target_id: 1,
        details: { customer_name: 'John Doe' }
      )

      logs = described_class.call(shop)

      expect(logs).not_to be_empty
      expect(logs.first[:action]).to eq('check_in')
      expect(logs.first[:staff_name]).to eq('Admin Staff')
    end

    it 'filters audit logs by action' do
      shop.audit_logs.create!(staff: staff, action: 'check_in', target_type: 'Membership', target_id: 1)
      shop.audit_logs.create!(staff: staff, action: 'member_created', target_type: 'Membership', target_id: 2)

      logs = described_class.call(shop, { log_action: 'check_in' })

      actions = logs.map { |l| l.fetch(:action) }
      expect(actions).to include('check_in')
      expect(actions).not_to include('member_created')
    end
  end
end
