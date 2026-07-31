# frozen_string_literal: true

require 'rails_helper'

# Exercises Authenticatable + ApiController via /auth/me (same JWT path).
# MembershipsController and other API resources should inherit ApiController.
RSpec.describe 'Current shop authentication', type: :request do
  let!(:shop) { create_shop(email: 'api@example.com') }

  it 'resolves current_shop from a Bearer JWT' do
    get '/auth/me', headers: auth_headers(shop)

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('shop', 'id')).to eq(shop.id)
  end

  it 'returns 401 when credentials are missing' do
    get '/auth/me'

    expect(response).to have_http_status(:unauthorized)
    expect(response.parsed_body['error']).to eq('Unauthorized')
  end

  it 'returns 401 when the token shop no longer exists' do
    token = JsonWebToken.encode({ shop_id: SecureRandom.uuid })

    get '/auth/me', headers: { 'Authorization' => "Bearer #{token}" }

    expect(response).to have_http_status(:unauthorized)
  end
end
