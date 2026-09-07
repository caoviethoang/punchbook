# frozen_string_literal: true

require 'rails_helper'

# rubocop:disable Rails/Pluck
RSpec.describe 'Memberships API Pagination & Filtering', type: :request do
  let(:shop) { create_shop }
  let(:session_package) { Package.create!(shop: shop, name: '10 Sessions', sessions_count: 10, price: 500_000) }
  let(:day_package) { Package.create!(shop: shop, name: '30 Days', duration_days: 30, price: 600_000) }

  before do
    Membership.create!(shop: shop, package: session_package, customer_name: 'An Active',
                       phone: '0901111111', sessions_left: 8)
    Membership.create!(shop: shop, package: session_package, customer_name: 'Binh Expiring',
                       phone: '0902222222', sessions_left: 2)
    Membership.create!(shop: shop, package: session_package, customer_name: 'Cuong Expired',
                       phone: '0903333333', sessions_left: 0)
    Membership.create!(shop: shop, package: day_package, customer_name: 'Dung Active Day',
                       phone: '0904444444', expires_at: Date.current + 20.days)
    Membership.create!(shop: shop, package: day_package, customer_name: 'Giang Expiring Day',
                       phone: '0905555555', expires_at: Date.current + 3.days)
    Membership.create!(shop: shop, package: day_package, customer_name: 'Hoa Expired Day',
                       phone: '0906666666', expires_at: Date.current - 1.day)
  end

  describe 'GET /memberships' do
    it 'returns paginated memberships with meta info' do
      get '/memberships?page=1&per_page=2', headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body

      expect(body['memberships'].length).to eq(2)
      expect(body['meta']).to include(
        'total' => 6,
        'page' => 1,
        'per_page' => 2,
        'total_pages' => 3
      )
    end

    it 'filters by active status' do
      get '/memberships?status=active', headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body

      names = body['memberships'].map { |m| m['customer_name'] }
      expect(names).to contain_exactly('An Active', 'Dung Active Day')
      expect(body['meta']['total']).to eq(2)
    end

    it 'filters by expiring status' do
      get '/memberships?status=expiring', headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body

      names = body['memberships'].map { |m| m['customer_name'] }
      expect(names).to contain_exactly('Binh Expiring', 'Giang Expiring Day')
      expect(body['meta']['total']).to eq(2)
    end

    it 'filters by expired status' do
      get '/memberships?status=expired', headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body

      names = body['memberships'].map { |m| m['customer_name'] }
      expect(names).to contain_exactly('Cuong Expired', 'Hoa Expired Day')
      expect(body['meta']['total']).to eq(2)
    end

    it 'combines search query, status filter, and pagination' do
      get '/memberships?query=Day&status=active&page=1&per_page=10', headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body

      names = body['memberships'].map { |m| m['customer_name'] }
      expect(names).to contain_exactly('Dung Active Day')
      expect(body['meta']['total']).to eq(1)
    end
  end
end
# rubocop:enable Rails/Pluck
