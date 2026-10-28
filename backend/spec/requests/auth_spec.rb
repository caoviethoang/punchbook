# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Auth', type: :request do
  describe 'POST /api/v1/auth/register' do
    it 'registers a shop and returns a JWT' do
      post '/api/v1/auth/register', params: {
        name: 'Lan Spa',
        phone: '0901000000',
        email: 'lan@example.com',
        password: 'password123',
        password_confirmation: 'password123'
      }

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body['token']).to be_present
      expect(body.dig('shop', 'email')).to eq('lan@example.com')
      expect(body.dig('shop', 'plan')).to eq('free')
    end

    it 'rejects invalid registration' do
      post '/api/v1/auth/register', params: {
        name: 'Lan Spa',
        email: 'bad',
        password: '123'
      }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['errors']).to be_present
      expect(response.parsed_body['code']).to eq('VALIDATION_ERROR')
    end
  end

  describe 'POST /api/v1/auth/login' do
    let!(:shop) { create_shop(email: 'owner@example.com', password: 'password123') }

    it 'logs in with valid credentials and returns a JWT' do
      post '/api/v1/auth/login', params: { email: 'owner@example.com', password: 'password123' }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['token']).to be_present
      expect(response.parsed_body.dig('shop', 'id')).to eq(shop.id)
    end

    it 'rejects invalid credentials' do
      post '/api/v1/auth/login', params: { email: 'owner@example.com', password: 'wrong' }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['error']).to eq('Invalid username/email, shop context, or password')
      expect(response.parsed_body['code']).to eq('INVALID_CREDENTIALS')
    end

    it 'logs in staff with shop_email context' do
      staff = Staff.create!(shop: shop, name: 'Mai Reception', username: 'mai_letan', password: 'password123',
                            role: 'staff')

      post '/api/v1/auth/login',
           params: { username: 'mai_letan', shop_email: 'owner@example.com', password: 'password123' }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig('staff', 'id')).to eq(staff.id)
    end

    it 'supports root path fallback for backward compatibility' do
      post '/auth/login', params: { email: 'owner@example.com', password: 'password123' }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['token']).to be_present
    end
  end

  describe 'GET /api/v1/auth/me' do
    let!(:shop) { create_shop(email: 'me@example.com', password: 'password123') }

    it 'returns the current shop when authorized' do
      get '/api/v1/auth/me', headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig('shop', 'email')).to eq('me@example.com')
    end

    it 'blocks unauthenticated requests' do
      get '/api/v1/auth/me'

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['error']).to eq('Unauthorized')
      expect(response.parsed_body['code']).to eq('UNAUTHORIZED')
    end

    it 'blocks invalid tokens' do
      get '/api/v1/auth/me', headers: { 'Authorization' => 'Bearer not-a-token' }

      expect(response).to have_http_status(:unauthorized)
    end

    it 'blocks non-Bearer authorization schemes' do
      get '/api/v1/auth/me', headers: { 'Authorization' => "Token #{token_for(shop)}" }

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'POST /api/v1/auth/register plan param' do
    it 'ignores plan=paid and keeps the free default' do
      post '/api/v1/auth/register', params: {
        name: 'Paid Attempt',
        phone: '0901999999',
        email: 'paid-attempt@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        plan: 'paid'
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body.dig('shop', 'plan')).to eq('free')
      expect(Shop.find_by!(email: 'paid-attempt@example.com').plan).to eq('free')
    end
  end
end
