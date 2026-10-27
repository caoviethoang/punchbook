# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Reports Export', type: :request do
  let(:paid_shop) { create_shop(name: 'Lan Spa Paid', email: 'paid@example.com', plan: 'paid') }
  let(:free_shop) { create_shop(name: 'Free Spa', email: 'free@example.com', plan: 'free') }

  let(:package) { Package.create!(shop: paid_shop, name: '10-session massage', sessions_count: 10, price: 1_000_000) }

  describe 'GET /api/v1/reports/export' do
    it 'returns 401 when unauthenticated' do
      get '/api/v1/reports/export'

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['code']).to eq('UNAUTHORIZED')
    end

    it 'returns 403 when shop is on free plan' do
      get '/api/v1/reports/export', headers: auth_headers(free_shop)

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['error']).to include('Gói Free không hỗ trợ xuất báo cáo')
      expect(response.parsed_body['code']).to eq('PLAN_UPGRADE_REQUIRED')
    end

    it 'returns 403 when user is non-admin staff' do
      staff = Staff.create!(
        shop: paid_shop, name: 'Staff User', username: 'staff1', password: 'password123', role: 'staff'
      )
      token = JsonWebToken.encode({ shop_id: paid_shop.id, staff_id: staff.id, role: 'staff' })

      get '/api/v1/reports/export', headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['code']).to eq('FORBIDDEN')
    end

    it 'returns 200 with an XLSX attachment when shop is on paid plan' do
      Membership.create!(
        shop: paid_shop,
        package: package,
        customer_name: 'Hoa Nguyen',
        phone: '0901234567',
        sessions_left: 5
      )

      get '/api/v1/reports/export', headers: auth_headers(paid_shop)

      expect(response).to have_http_status(:ok)
      expect(response.headers['Content-Type']).to eq(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(response.headers['Content-Disposition']).to include('attachment; filename=')
      expect(response.body.bytesize).to be > 0
    end
  end

  describe 'GET /api/v1/reports/attendance' do
    let!(:member) do
      Membership.create!(
        shop: paid_shop,
        package: package,
        customer_name: 'Nguyen Van A',
        phone: '0901111111',
        sessions_left: 8
      )
    end

    let!(:staff) do
      Staff.create!(shop: paid_shop, name: 'Coach Tuan', username: 'coach_rep', password: 'password123', role: 'admin')
    end

    it 'returns 401 when unauthenticated' do
      get '/api/v1/reports/attendance'

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['code']).to eq('UNAUTHORIZED')
    end

    it 'returns 403 when user is regular staff' do
      staff = Staff.create!(
        shop: paid_shop, name: 'Staff Member', username: 'staff_att', password: 'password123', role: 'staff'
      )
      token = JsonWebToken.encode({ shop_id: paid_shop.id, staff_id: staff.id, role: 'staff' })

      get '/api/v1/reports/attendance', headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['code']).to eq('FORBIDDEN')
    end

    it 'returns 200 JSON with attendance report even for free plan shops' do
      free_package = Package.create!(shop: free_shop, name: 'Free Package', sessions_count: 5, price: 100_000)
      Membership.create!(
        shop: free_shop,
        package: free_package,
        customer_name: 'Free Member',
        phone: '0909999999',
        sessions_left: 5
      )

      get '/api/v1/reports/attendance?month=2026-10', headers: auth_headers(free_shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['month']).to eq('2026-10')
      expect(body['summary']['total_members']).to eq(1)
      expect(body['summary']['inactive_members_count']).to eq(1)
      expect(body['attendance'].first['is_inactive']).to be(true)
    end

    it 'returns ranked attendance for paid shop' do
      CheckIn.create!(membership: member, staff: staff, checked_in_at: Time.zone.parse('2026-10-10 10:00:00'))

      get '/api/v1/reports/attendance?month=2026-10', headers: auth_headers(paid_shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['month']).to eq('2026-10')
      expect(body['summary']['total_check_ins']).to eq(1)
      expect(body['summary']['active_members_count']).to eq(1)
      expect(body['attendance'].first['check_ins_count']).to eq(1)
      expect(body['attendance'].first['rank']).to eq(1)
      expect(body['attendance'].first['is_inactive']).to be(false)
    end
  end

  describe 'GET /api/v1/reports/attendance/export' do
    it 'returns 401 when unauthenticated' do
      get '/api/v1/reports/attendance/export'

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['code']).to eq('UNAUTHORIZED')
    end

    it 'returns 403 when shop is on free plan' do
      get '/api/v1/reports/attendance/export?month=2026-10', headers: auth_headers(free_shop)

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['error']).to include('Gói Free không hỗ trợ xuất báo cáo')
      expect(response.parsed_body['code']).to eq('PLAN_UPGRADE_REQUIRED')
    end

    it 'returns 200 with XLSX file for paid shop' do
      get '/api/v1/reports/attendance/export?month=2026-10', headers: auth_headers(paid_shop)

      expect(response).to have_http_status(:ok)
      expect(response.headers['Content-Type']).to eq(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(response.headers['Content-Disposition']).to include('attachment; filename="punchbook_attendance_2026-10_')
      expect(response.body.bytesize).to be > 0
    end
  end
end
