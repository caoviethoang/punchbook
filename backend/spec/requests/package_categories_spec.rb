# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'PackageCategories', type: :request do
  let!(:shop) { create_shop(name: 'Louiscao Fitness', email: 'louiscao@example.com') }

  describe 'GET /package_categories' do
    it 'returns 401 when unauthenticated' do
      get '/package_categories'
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns package categories belonging to current shop' do
      PackageCategory.create!(shop: shop, name: 'Fitness')
      PackageCategory.create!(shop: shop, name: 'Yoga')

      other_shop = create_shop(name: 'Other', email: 'other@example.com')
      PackageCategory.create!(shop: other_shop, name: 'Boxing')

      get '/package_categories', headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      names = response.parsed_body['categories'].pluck('name')
      expect(names).to eq(%w[Fitness Yoga])
    end
  end

  describe 'POST /package_categories' do
    it 'creates a new package category for current shop' do
      post '/package_categories', params: { package_category: { name: 'Boxing' } }, headers: auth_headers(shop)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body['name']).to eq('Boxing')
      expect(shop.package_categories.pluck(:name)).to include('Boxing')
    end

    it 'returns existing category if duplicate name' do
      cat = PackageCategory.create!(shop: shop, name: 'Pilates')

      post '/package_categories', params: { package_category: { name: 'Pilates' } }, headers: auth_headers(shop)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body['id']).to eq(cat.id)
    end
  end

  describe 'PATCH /package_categories/:id' do
    it 'updates category name for current shop' do
      cat = PackageCategory.create!(shop: shop, name: 'Kickboxing')

      patch "/package_categories/#{cat.id}",
            params: { package_category: { name: 'Muay Thai' } },
            headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['name']).to eq('Muay Thai')
      expect(cat.reload.name).to eq('Muay Thai')
    end
  end

  describe 'DELETE /package_categories/:id' do
    it 'deletes category for current shop' do
      cat = PackageCategory.create!(shop: shop, name: 'Zumba')

      delete "/package_categories/#{cat.id}", headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(PackageCategory.exists?(cat.id)).to be false
    end
  end
end
