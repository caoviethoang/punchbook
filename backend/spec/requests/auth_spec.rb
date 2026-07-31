# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Auth', type: :request do
  describe 'POST /auth/register' do
    it 'registers a shop and returns a JWT' do
      post '/auth/register', params: {
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
      post '/auth/register', params: {
        name: 'Lan Spa',
        email: 'bad',
        password: '123'
      }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['errors']).to be_present
    end
  end

  describe 'POST /auth/login' do
    let!(:shop) { create_shop(email: 'owner@example.com', password: 'password123') }

    it 'logs in with valid credentials and returns a JWT' do
      post '/auth/login', params: { email: 'owner@example.com', password: 'password123' }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['token']).to be_present
      expect(response.parsed_body.dig('shop', 'id')).to eq(shop.id)
    end

    it 'rejects invalid credentials' do
      post '/auth/login', params: { email: 'owner@example.com', password: 'wrong' }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['error']).to eq('Invalid email or password')
    end
  end

  describe 'GET /auth/me' do
    let!(:shop) { create_shop(email: 'me@example.com', password: 'password123') }

    it 'returns the current shop when authorized' do
      get '/auth/me', headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig('shop', 'email')).to eq('me@example.com')
    end

    it 'blocks unauthenticated requests' do
      get '/auth/me'

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['error']).to eq('Unauthorized')
    end

    it 'blocks invalid tokens' do
      get '/auth/me', headers: { 'Authorization' => 'Bearer not-a-token' }

      expect(response).to have_http_status(:unauthorized)
    end

    it 'blocks non-Bearer authorization schemes' do
      get '/auth/me', headers: { 'Authorization' => "Token #{token_for(shop)}" }

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'POST /auth/register plan param' do
    it 'ignores plan=paid and keeps the free default' do
      post '/auth/register', params: {
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
