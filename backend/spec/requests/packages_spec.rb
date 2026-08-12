# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Packages', type: :request do
  let!(:shop) { create_shop(name: 'Lan Spa', email: 'lan@example.com') }

  describe 'POST /packages' do
    it 'returns 401 when unauthenticated' do
      post '/packages', params: { package: { name: 'Gói 10 buổi', price: 500_000, sessions_count: 10 } }

      expect(response).to have_http_status(:unauthorized)
    end

    it 'creates a session-based package successfully for current_shop' do
      payload = {
        package: {
          name: 'Gói 10 buổi massage',
          price: 1_000_000,
          sessions_count: 10
        }
      }

      expect do
        post '/packages', params: payload, headers: auth_headers(shop)
      end.to change(Package, :count).by(1)

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body['name']).to eq('Gói 10 buổi massage')
      expect(body['price']).to eq(1_000_000)
      expect(body['sessions_count']).to eq(10)
      expect(body['duration_days']).to be_nil
      expect(body['shop_id']).to eq(shop.id)
    end

    it 'creates a day-duration-based package successfully for current_shop' do
      payload = {
        package: {
          name: 'Gói Gym 30 ngày',
          price: 500_000,
          duration_days: 30
        }
      }

      expect do
        post '/packages', params: payload, headers: auth_headers(shop)
      end.to change(Package, :count).by(1)

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body['name']).to eq('Gói Gym 30 ngày')
      expect(body['price']).to eq(500_000)
      expect(body['duration_days']).to eq(30)
      expect(body['sessions_count']).to be_nil
      expect(body['shop_id']).to eq(shop.id)
    end

    it 'returns 422 unprocessable_entity when invalid (missing name and price)' do
      payload = {
        package: {
          sessions_count: 10
        }
      }

      post '/packages', params: payload, headers: auth_headers(shop)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['errors']).to include("Name can't be blank", "Price can't be blank")
    end

    it 'returns 422 unprocessable_entity when both sessions_count and duration_days are set' do
      payload = {
        package: {
          name: 'Invalid Combo',
          price: 500_000,
          sessions_count: 10,
          duration_days: 30
        }
      }

      post '/packages', params: payload, headers: auth_headers(shop)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['errors']).to include('Must set exactly one of sessions_count or duration_days')
    end

    it 'returns 422 unprocessable_entity when neither sessions_count nor duration_days is set' do
      payload = {
        package: {
          name: 'Empty Package',
          price: 500_000
        }
      }

      post '/packages', params: payload, headers: auth_headers(shop)

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body['errors']).to include('Must set exactly one of sessions_count or duration_days')
    end
  end
end
