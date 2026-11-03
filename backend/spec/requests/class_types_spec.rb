# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'ClassTypes API', type: :request do
  let!(:shop) { create_shop(name: 'Yoga Studio', phone: '0901112222') }
  let!(:other_shop) { create_shop(name: 'Pilates Studio', phone: '0903334444') }
  let!(:yoga) do
    ClassType.create!(
      shop: shop, name: 'Hatha Yoga', color: '#6366f1',
      default_capacity: 15, default_duration_minutes: 60
    )
  end

  describe 'GET /api/v1/class_types' do
    it 'returns list of class types for the shop' do
      get '/api/v1/class_types', headers: auth_headers(shop)
      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['class_types'].size).to eq(1)
      expect(body['class_types'].first['name']).to eq('Hatha Yoga')
    end

    it 'does not return class types from other shops' do
      get '/api/v1/class_types', headers: auth_headers(other_shop)
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['class_types']).to be_empty
    end
  end

  describe 'POST /api/v1/class_types' do
    it 'creates a new class type' do
      params = {
        class_type: {
          name: 'Vinyasa Flow',
          color: '#10b981',
          default_capacity: 20,
          default_duration_minutes: 45,
          description: 'Dynamic flow class'
        }
      }

      post '/api/v1/class_types', params: params, headers: auth_headers(shop)
      expect(response).to have_http_status(:created)
      expect(response.parsed_body.dig('class_type', 'name')).to eq('Vinyasa Flow')
    end
  end

  describe 'PATCH /api/v1/class_types/:id' do
    it 'updates an existing class type' do
      patch "/api/v1/class_types/#{yoga.id}",
            params: { class_type: { name: 'Gentle Yoga' } },
            headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(yoga.reload.name).to eq('Gentle Yoga')
    end
  end

  describe 'DELETE /api/v1/class_types/:id' do
    it 'destroys class type without schedules' do
      delete "/api/v1/class_types/#{yoga.id}", headers: auth_headers(shop)
      expect(response).to have_http_status(:no_content)
      expect(ClassType.find_by(id: yoga.id)).to be_nil
    end
  end
end
