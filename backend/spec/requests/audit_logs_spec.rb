# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'AuditLogs', type: :request do
  let!(:shop) { create_shop(name: 'Spa Club', email: 'spa@example.com') }
  let!(:staff) { Staff.create!(shop: shop, name: 'Anna', role: 'staff') }

  describe 'GET /audit_logs' do
    it 'returns 401 when unauthenticated' do
      get '/audit_logs'

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns shop-scoped audit logs' do
      package = Package.create!(shop: shop, name: 'Standard 10', price: 200_000, sessions_count: 10)
      membership = Membership.create!(
        shop: shop,
        package: package,
        customer_name: 'John',
        phone: '0988888888',
        sessions_left: 10
      )

      log1 = AuditLog.log_check_in!(shop: shop, staff: staff, membership: membership, checked_in_at: Time.current)

      other_shop = create_shop(name: 'Other Shop', email: 'other@example.com')
      other_pkg = Package.create!(shop: other_shop, name: 'Other Pkg', price: 100_000, sessions_count: 5)
      other_mem = Membership.create!(
        shop: other_shop,
        package: other_pkg,
        customer_name: 'Bob',
        phone: '0977777777',
        sessions_left: 5
      )
      AuditLog.log_check_in!(shop: other_shop, staff: nil, membership: other_mem, checked_in_at: Time.current)

      get '/audit_logs', headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['audit_logs'].length).to eq(1)
      expect(body['audit_logs'].first['id']).to eq(log1.id)
      expect(body['audit_logs'].first['staff_name']).to eq('Anna')
    end

    it 'filters audit logs by log_action' do
      package = Package.create!(shop: shop, name: 'Standard 10', price: 200_000, sessions_count: 10)
      membership = Membership.create!(
        shop: shop,
        package: package,
        customer_name: 'John',
        phone: '0988888888',
        sessions_left: 10
      )

      AuditLog.log_check_in!(shop: shop, staff: staff, membership: membership, checked_in_at: Time.current)
      renew_log = AuditLog.log_membership_renewed!(
        shop: shop,
        staff: staff,
        membership: membership,
        sessions_before: 0,
        expires_at_before: Time.current
      )

      get '/audit_logs', params: { log_action: 'membership_renewed' }, headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['audit_logs'].length).to eq(1)
      expect(body['audit_logs'].first['id']).to eq(renew_log.id)
      expect(body['audit_logs'].first['action']).to eq('membership_renewed')
    end
  end
end
