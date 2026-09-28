# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Settings API', type: :request do
  let!(:shop) do
    create_shop(
      name: 'PunchBook Barber',
      phone: '0901112222',
      address: '100 QL1A',
      password: 'password123',
      password_confirmation: 'password123'
    )
  end

  describe 'GET /settings' do
    it 'returns the current shop settings' do
      get '/settings', headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body.dig('shop', 'id')).to eq(shop.id)
      expect(body.dig('shop', 'name')).to eq('PunchBook Barber')
      expect(body.dig('shop', 'phone')).to eq('0901112222')
      expect(body.dig('shop', 'address')).to eq('100 QL1A')
      expect(body.dig('shop', 'plan')).to eq('free')
    end

    it 'rejects unauthenticated requests' do
      get '/settings'

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'PATCH /settings/profile' do
    it 'updates profile info successfully' do
      patch '/settings/profile',
            params: {
              name: 'PunchBook Gym',
              phone: '0988776655',
              address: '200 Lê Lợi',
              bank_name: 'MBBank',
              bank_account_no: '0123456789',
              bank_account_name: 'HOANG CAO VIET'
            },
            headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['message']).to eq('Cập nhật thông tin tiệm thành công')
      expect(body.dig('shop', 'name')).to eq('PunchBook Gym')
      expect(body.dig('shop', 'address')).to eq('200 Lê Lợi')
      expect(body.dig('shop', 'bank_name')).to eq('MBBank')
      expect(body.dig('shop', 'bank_account_no')).to eq('0123456789')
      expect(body.dig('shop', 'bank_account_name')).to eq('HOANG CAO VIET')
    end

    it 'returns unprocessable when params are invalid' do
      patch '/settings/profile', params: { name: '' }, headers: auth_headers(shop)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['errors']).to include("Name can't be blank")
    end
  end

  describe 'PATCH /settings/password' do
    it 'changes password successfully' do
      patch '/settings/password', params: {
        current_password: 'password123',
        password: 'newsecurepassword',
        password_confirmation: 'newsecurepassword'
      }, headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['message']).to eq('Đổi mật khẩu thành công')

      expect(shop.reload.valid_password?('newsecurepassword')).to be true
    end

    it 'returns error when current password is invalid' do
      patch '/settings/password', params: {
        current_password: 'wrongpassword',
        password: 'newsecurepassword',
        password_confirmation: 'newsecurepassword'
      }, headers: auth_headers(shop)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['errors']).to include('Mật khẩu hiện tại không đúng')
    end
  end

  describe 'POST /settings/upgrade_plan' do
    it 'upgrades plan to paid and sets plan_expires_at' do
      post '/settings/upgrade_plan', params: { months: 6 }, headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['message']).to eq('Nâng cấp gói Premium thành công!')
      expect(body.dig('shop', 'plan')).to eq('paid')
      expect(shop.reload.plan).to eq('paid')
      expect(shop.plan_expires_at).to be > Time.current
    end
  end
end
