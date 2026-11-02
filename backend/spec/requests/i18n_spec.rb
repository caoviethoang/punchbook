# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API I18n and Accept-Language header', type: :request do
  let(:shop) { create_shop(name: 'I18n Shop', plan: 'free') }
  let(:package) { Package.create!(shop: shop, name: '10 sessions', sessions_count: 10, price: 100_000) }
  let(:member) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'Member Test',
      phone: '0901234567',
      sessions_left: 0
    )
  end

  describe 'Authentication & Authorization errors' do
    it 'returns Unauthorized in Vietnamese when Accept-Language is vi' do
      get '/api/v1/auth/me', headers: { 'Accept-Language' => 'vi' }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['error']).to eq('Không có quyền truy cập. Vui lòng đăng nhập.')
      expect(response.parsed_body['code']).to eq('UNAUTHORIZED')
    end

    it 'returns Unauthorized in English when Accept-Language is en' do
      get '/api/v1/auth/me', headers: { 'Accept-Language' => 'en' }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['error']).to eq('Unauthorized')
      expect(response.parsed_body['code']).to eq('UNAUTHORIZED')
    end

    it 'returns Forbidden in Vietnamese when non-admin staff performs restricted action' do
      staff = Staff.create!(
        shop: shop, name: 'Staff User', username: 'staff1', password: 'password123', role: 'staff'
      )
      token = JsonWebToken.encode({ shop_id: shop.id, staff_id: staff.id, role: 'staff' })

      get '/api/v1/reports/export', headers: {
        'Authorization' => "Bearer #{token}",
        'Accept-Language' => 'vi'
      }

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['error']).to eq('Truy cập bị từ chối. Bạn không có quyền thực hiện hành động này.')
      expect(response.parsed_body['code']).to eq('FORBIDDEN')
    end

    it 'returns Forbidden in English when Accept-Language is en' do
      staff = Staff.create!(
        shop: shop, name: 'Staff User', username: 'staff1', password: 'password123', role: 'staff'
      )
      token = JsonWebToken.encode({ shop_id: shop.id, staff_id: staff.id, role: 'staff' })

      get '/api/v1/reports/export', headers: {
        'Authorization' => "Bearer #{token}",
        'Accept-Language' => 'en'
      }

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['error']).to eq('Access denied. You do not have permission to perform this action.')
      expect(response.parsed_body['code']).to eq('FORBIDDEN')
    end
  end

  describe 'Not Found error' do
    it 'returns Not Found in Vietnamese when Accept-Language is vi' do
      get "/api/v1/memberships/#{SecureRandom.uuid}", headers: auth_headers(shop).merge('Accept-Language' => 'vi')

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['error']).to eq('Không tìm thấy dữ liệu yêu cầu.')
      expect(response.parsed_body['code']).to eq('NOT_FOUND')
    end

    it 'returns Not Found in English when Accept-Language is en' do
      get "/api/v1/memberships/#{SecureRandom.uuid}", headers: auth_headers(shop).merge('Accept-Language' => 'en')

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['error']).to eq('Not found')
      expect(response.parsed_body['code']).to eq('NOT_FOUND')
    end
  end

  describe 'Business logic error (no sessions left)' do
    it 'returns localized error in Vietnamese for membership check in' do
      post "/api/v1/memberships/#{member.id}/check_in",
           headers: auth_headers(shop).merge('Accept-Language' => 'vi-VN,vi;q=0.9')

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['error']).to eq('Hội viên đã hết số buổi tập.')
    end

    it 'returns localized error in English for membership check in' do
      post "/api/v1/memberships/#{member.id}/check_in",
           headers: auth_headers(shop).merge('Accept-Language' => 'en-US,en;q=0.8')

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['error']).to eq('Membership has no sessions left')
    end
  end

  describe 'Login error' do
    it 'returns localized invalid credentials error in Vietnamese' do
      post '/api/v1/auth/login',
           params: { email: 'nonexistent@example.com', password: 'wrong' },
           headers: { 'Accept-Language' => 'vi' }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['error']).to eq(
        'Tên đăng nhập, email, thông tin cửa hàng hoặc mật khẩu không chính xác.'
      )
    end

    it 'returns localized invalid credentials error in English' do
      post '/api/v1/auth/login',
           params: { email: 'nonexistent@example.com', password: 'wrong' },
           headers: { 'Accept-Language' => 'en' }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['error']).to eq('Invalid username/email, shop context, or password')
    end
  end
end
