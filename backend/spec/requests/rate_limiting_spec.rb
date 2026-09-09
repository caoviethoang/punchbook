# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Rate Limiting (Rack::Attack)', type: :request do
  before do
    Rack::Attack.enabled = true
    Rack::Attack.reset!
  end

  after do
    Rack::Attack.enabled = false
    Rack::Attack.reset!
  end

  describe 'POST /auth/login rate limiting' do
    it 'allows up to 5 requests per minute and blocks the 6th request' do
      5.times do
        post '/auth/login', params: { email: 'wrong@example.com', password: 'badpassword' }
        expect(response.status).not_to eq(429)
      end

      post '/auth/login', params: { email: 'wrong@example.com', password: 'badpassword' }
      expect(response).to have_http_status(:too_many_requests)

      json = response.parsed_body
      expect(json['error']).to eq('Too Many Requests')
      expect(json['message']).to eq('Quá nhiều yêu cầu. Vui lòng thử lại sau.')
    end
  end

  describe 'PATCH /settings/password rate limiting' do
    it 'allows up to 5 requests per minute and blocks the 6th request' do
      5.times do
        patch '/settings/password', params: { current_password: 'old', password: 'new', password_confirmation: 'new' }
        expect(response.status).not_to eq(429)
      end

      patch '/settings/password', params: { current_password: 'old', password: 'new', password_confirmation: 'new' }
      expect(response).to have_http_status(:too_many_requests)

      json = response.parsed_body
      expect(json['error']).to eq('Too Many Requests')
      expect(json['message']).to eq('Quá nhiều yêu cầu. Vui lòng thử lại sau.')
    end
  end

  describe 'POST /memberships/:id/check_in rate limiting' do
    it 'allows up to 10 requests per minute and blocks the 11th request' do
      10.times do
        post '/memberships/123/check_in'
        expect(response.status).not_to eq(429)
      end

      post '/memberships/123/check_in'
      expect(response).to have_http_status(:too_many_requests)

      json = response.parsed_body
      expect(json['error']).to eq('Too Many Requests')
      expect(json['message']).to eq('Quá nhiều yêu cầu. Vui lòng thử lại sau.')
    end
  end

  describe 'Unthrottled endpoints' do
    it 'does not rate limit GET /auth/me requests under low threshold' do
      6.times do
        get '/auth/me'
        expect(response.status).not_to eq(429)
      end
    end
  end
end
