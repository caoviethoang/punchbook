# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Tags API', type: :request do
  let!(:shop) { create_shop(name: 'Boxing Club', phone: '0901112222') }
  let!(:other_shop) { create_shop(name: 'Yoga Club', phone: '0903334444') }
  let!(:vip_tag) { Tag.create!(shop: shop, name: 'VIP', color: '#f59e0b') }
  let!(:morning_tag) { Tag.create!(shop: shop, name: 'Morning Club', color: '#10b981') }

  describe 'GET /api/v1/tags' do
    it 'returns only tags belonging to the current shop' do
      Tag.create!(shop: other_shop, name: 'Other VIP', color: '#ef4444')
      get '/api/v1/tags', headers: auth_headers(shop)
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['tags'].pluck('name')).to eq(['Morning Club', 'VIP'])
    end
  end

  describe 'POST /api/v1/tags' do
    it 'creates a tag for the current shop' do
      expect do
        post '/api/v1/tags',
             params: { tag: { name: 'Corporate', color: '#3b82f6' } },
             headers: auth_headers(shop),
             as: :json
      end.to change(Tag, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body['tag']).to include('name' => 'Corporate', 'color' => '#3b82f6')
    end

    it 'rejects duplicate tag names in the same shop (case-insensitive)' do
      post '/api/v1/tags',
           params: { tag: { name: 'vip', color: '#3b82f6' } },
           headers: auth_headers(shop),
           as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe 'PATCH /api/v1/tags/:id' do
    it 'updates a tag in the current shop' do
      patch "/api/v1/tags/#{vip_tag.id}",
            params: { tag: { name: 'VVIP', color: '#8b5cf6' } },
            headers: auth_headers(shop),
            as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['tag']).to include('name' => 'VVIP', 'color' => '#8b5cf6')
    end

    it 'returns not_found when updating a tag from another shop' do
      other_tag = Tag.create!(shop: other_shop, name: 'VIP', color: '#ef4444')
      patch "/api/v1/tags/#{other_tag.id}",
            params: { tag: { name: 'Hacked' } },
            headers: auth_headers(shop),
            as: :json

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'DELETE /api/v1/tags/:id' do
    it 'deletes a tag in the current shop' do
      expect do
        delete "/api/v1/tags/#{morning_tag.id}", headers: auth_headers(shop)
      end.to change(Tag, :count).by(-1)

      expect(response).to have_http_status(:ok)
    end
  end

  describe 'Membership tagging and filtering' do
    let!(:package) { Package.create!(shop: shop, name: '10 Sessions', price: 1_000_000, sessions_count: 10) }

    it 'creates and updates a membership with tag_ids' do
      post '/api/v1/memberships',
           params: {
             membership: {
               customer_name: 'Nguyen Van A', phone: '0905556666',
               package_id: package.id, tag_ids: [vip_tag.id]
             }
           },
           headers: auth_headers(shop), as: :json

      expect(response).to have_http_status(:created)
      created = response.parsed_body['membership']
      expect(created['tags'].pluck('id')).to eq([vip_tag.id])

      patch "/api/v1/memberships/#{created['id']}",
            params: { membership: { tag_ids: [morning_tag.id] } },
            headers: auth_headers(shop), as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['membership']['tags'].pluck('id')).to eq([morning_tag.id])
    end

    it 'filters GET /api/v1/memberships?tag_ids=...' do
      m1 = CreateMembership.call(shop: shop, customer_name: 'Nguyen Van A', phone: '0905556666',
                                 package_id: package.id, tag_ids: [vip_tag.id])
      m2 = CreateMembership.call(shop: shop, customer_name: 'Tran Thi B', phone: '0907778888',
                                 package_id: package.id, tag_ids: [morning_tag.id])

      get "/api/v1/memberships?tag_ids=#{vip_tag.id}", headers: auth_headers(shop)
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['memberships'].pluck('id')).to eq([m1.id])

      get "/api/v1/memberships?tag_ids=#{vip_tag.id},#{morning_tag.id}", headers: auth_headers(shop)
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['memberships'].pluck('id')).to contain_exactly(m1.id, m2.id)
    end
  end
end
