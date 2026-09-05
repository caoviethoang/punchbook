# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Audit Logs API', type: :request do
  let!(:shop) { create_shop(name: 'Lan Spa', email: 'lan@example.com') }
  let!(:staff) { Staff.create!(shop: shop, name: 'Test Staff', role: 'cashier') }
  let!(:package) { Package.create!(shop: shop, name: '10 sessions', sessions_count: 10, price: 500_000) }
  let!(:membership) do
    Membership.create!(
      shop: shop, package: package,
      customer_name: 'Hoa Nguyen', phone: '0902000000', sessions_left: 10
    )
  end

  before do
    AuditLog.log_check_in!(shop: shop, staff: staff, membership: membership, checked_in_at: 1.day.ago)
    AuditLog.log_membership_created!(shop: shop, staff: staff, membership: membership)
  end

  describe 'GET /audit_logs' do
    it 'returns 401 when unauthenticated' do
      get '/audit_logs'
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns audit logs for current shop' do
      get '/audit_logs', headers: auth_headers(shop)
      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)
      expect(body['audit_logs'].length).to eq(2)
      expect(body['audit_logs'].first['action']).to eq('membership_created')
      expect(body['audit_logs'].first['staff_name']).to eq('Test Staff')
      expect(body['audit_logs'].first['details']['customer_name']).to eq('Hoa Nguyen')
    end

    it 'filters by action' do
      get '/audit_logs?action=check_in', headers: auth_headers(shop)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['audit_logs'].length).to eq(1)
      expect(body['audit_logs'].first['action']).to eq('check_in')
    end

    it 'filters by staff' do
      get "/audit_logs?staff_id=#{staff.id}", headers: auth_headers(shop)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['audit_logs'].length).to eq(2)
    end

    it 'does not return logs from other shops' do
      other_shop = create_shop(name: 'Other Spa', email: 'other@example.com')
      AuditLog.log_check_in!(
        shop: other_shop,
        staff: nil,
        membership: Membership.create!(shop: other_shop, package: Package.create!(shop: other_shop, name: 'pkg', sessions_count: 5, price: 300_000), customer_name: 'Other', phone: '0999999999', sessions_left: 5),
        checked_in_at: Time.current
      )

      get '/audit_logs', headers: auth_headers(shop)
      body = JSON.parse(response.body)
      expect(body['audit_logs'].length).to eq(2)
    end
  end
end
