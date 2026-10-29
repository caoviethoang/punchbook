# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Rate Limiting (Rack::Attack)', type: :request do
  before do
    Rack::Attack.enabled = true
    Rack::Attack.reset!
    Rack::Attack.cache.store.clear if Rack::Attack.cache.store.respond_to?(:clear)
  end

  after do
    Rack::Attack.enabled = false
    Rack::Attack.reset!
    Rack::Attack.cache.store.clear if Rack::Attack.cache.store.respond_to?(:clear)
  end

  describe 'POST /api/v1/auth/login rate limiting (Brute-force protection)' do
    let(:shop) { create_shop(email: 'owner@example.com', password: 'password123') }

    it 'allows up to 10 failed login attempts within 5 minutes and blocks the 11th request' do
      10.times do
        post '/api/v1/auth/login', params: { email: 'wrong@example.com', password: 'badpassword' }
        expect(response).to have_http_status(:unauthorized)
      end

      post '/api/v1/auth/login', params: { email: 'wrong@example.com', password: 'badpassword' }
      expect(response).to have_http_status(:too_many_requests)

      json = response.parsed_body
      expect(json['error']).to eq('Too Many Requests')
      expect(json['code']).to eq('TOO_MANY_REQUESTS')
      expect(json['message']).to eq('Quá nhiều yêu cầu. Vui lòng thử lại sau.')
    end

    it 'logs blocked IP when rate limit is exceeded' do
      allow(Rails.logger).to receive(:warn).and_call_original

      10.times do
        post '/api/v1/auth/login', params: { email: 'wrong@example.com', password: 'badpassword' }
        expect(response).to have_http_status(:unauthorized)
      end

      post '/api/v1/auth/login', params: { email: 'wrong@example.com', password: 'badpassword' }
      expect(response).to have_http_status(:too_many_requests)
      expect(Rails.logger).to have_received(:warn).with(
        %r{\[Rack::Attack\]\[blocklist\] Blocked IP: 127\.0\.0\.1 \| Rule: logins/ip \| Path: /api/v1/auth/login}
      )
    end

    it 'does not block legitimate users performing successful logins' do
      12.times do
        post '/api/v1/auth/login', params: { email: shop.email, password: 'password123' }
        expect(response).to have_http_status(:ok)
      end
    end

    it 'resets failure counter upon successful login' do
      5.times do
        post '/api/v1/auth/login', params: { email: 'wrong@example.com', password: 'badpassword' }
        expect(response).to have_http_status(:unauthorized)
      end

      post '/api/v1/auth/login', params: { email: shop.email, password: 'password123' }
      expect(response).to have_http_status(:ok)

      6.times do
        post '/api/v1/auth/login', params: { email: 'wrong@example.com', password: 'badpassword' }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'PATCH /api/v1/settings/password rate limiting' do
    it 'allows up to 5 requests per minute and blocks the 6th request' do
      5.times do
        patch '/api/v1/settings/password',
              params: { current_password: 'old', password: 'new', password_confirmation: 'new' }
        expect(response.status).not_to eq(429)
      end

      patch '/api/v1/settings/password',
            params: { current_password: 'old', password: 'new', password_confirmation: 'new' }
      expect(response).to have_http_status(:too_many_requests)

      json = response.parsed_body
      expect(json['error']).to eq('Too Many Requests')
      expect(json['code']).to eq('TOO_MANY_REQUESTS')
      expect(json['message']).to eq('Quá nhiều yêu cầu. Vui lòng thử lại sau.')
    end
  end

  describe 'POST /api/v1/memberships/:id/check_in rate limiting' do
    it 'allows up to 10 requests per minute and blocks the 11th request' do
      10.times do
        post '/api/v1/memberships/123/check_in'
        expect(response.status).not_to eq(429)
      end

      post '/api/v1/memberships/123/check_in'
      expect(response).to have_http_status(:too_many_requests)

      json = response.parsed_body
      expect(json['error']).to eq('Too Many Requests')
      expect(json['code']).to eq('TOO_MANY_REQUESTS')
      expect(json['message']).to eq('Quá nhiều yêu cầu. Vui lòng thử lại sau.')
    end
  end

  describe 'Unthrottled endpoints' do
    it 'does not rate limit GET /api/v1/auth/me requests under low threshold' do
      6.times do
        get '/api/v1/auth/me'
        expect(response.status).not_to eq(429)
      end
    end
  end
end
