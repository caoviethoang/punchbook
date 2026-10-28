# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'RBAC Permissions', type: :request do
  let!(:shop) { create_shop(name: 'Spa Club', email: 'owner@spa.com') }
  let!(:staff) { Staff.create!(shop: shop, name: 'Kasumi', role: 'staff') }
  let!(:membership) do
    pkg = Package.create!(shop: shop, name: 'Yoga 10', price: 500_000, sessions_count: 10)
    Membership.create!(shop: shop, package: pkg, customer_name: 'John Doe', phone: '0988888888', sessions_left: 10)
  end

  def staff_headers
    auth_headers(shop, role: 'staff', staff: staff)
  end

  def owner_headers
    auth_headers(shop, role: 'owner')
  end

  describe 'Staff role permissions' do
    it 'allows staff to view memberships list' do
      get '/api/v1/memberships', headers: staff_headers
      expect(response).to have_http_status(:ok)
    end

    it 'allows staff to view membership detail' do
      get "/api/v1/memberships/#{membership.id}", headers: staff_headers
      expect(response).to have_http_status(:ok)
    end

    it 'allows staff to perform check-in' do
      post "/api/v1/memberships/#{membership.id}/check_in", params: { staff_id: staff.id }, headers: staff_headers
      expect(response).to have_http_status(:ok)
    end

    it 'allows staff to view packages' do
      get '/api/v1/packages', headers: staff_headers
      expect(response).to have_http_status(:ok)
    end

    it 'forbids staff from creating packages' do
      post '/api/v1/packages', params: { package: { name: 'New Pkg', price: 100_000, sessions_count: 5 } },
                               headers: staff_headers
      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['error']).to be_present
      expect(response.parsed_body['code']).to eq('FORBIDDEN')
    end

    it 'forbids staff from deleting packages' do
      delete "/api/v1/packages/#{membership.package_id}", headers: staff_headers
      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['code']).to eq('FORBIDDEN')
    end

    it 'allows staff to create memberships' do
      payload = { membership: { customer_name: 'Bob', phone: '0911111111', package_id: membership.package_id } }
      post '/api/v1/memberships', params: payload, headers: staff_headers
      expect(response).to have_http_status(:created)
    end

    it 'allows staff to delete memberships' do
      delete "/api/v1/memberships/#{membership.id}", headers: staff_headers
      expect(response).to have_http_status(:ok)
    end

    it 'forbids staff from importing memberships' do
      post '/api/v1/memberships/import', headers: staff_headers
      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['code']).to eq('FORBIDDEN')
    end

    it 'allows staff to view settings' do
      get '/api/v1/settings', headers: staff_headers
      expect(response).to have_http_status(:ok)
    end

    it 'forbids staff from updating shop profile' do
      patch '/api/v1/settings/profile', params: { name: 'Hacked Spa' }, headers: staff_headers
      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['code']).to eq('FORBIDDEN')
    end

    it 'forbids staff from updating shop password' do
      payload = { current_password: 'old', password: 'new', password_confirmation: 'new' }
      patch '/api/v1/settings/password', params: payload, headers: staff_headers
      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['code']).to eq('FORBIDDEN')
    end

    it 'forbids staff from viewing revenue dashboard' do
      get '/api/v1/dashboard', headers: staff_headers
      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['code']).to eq('FORBIDDEN')
    end

    it 'forbids staff from exporting revenue reports' do
      get '/api/v1/reports/export', headers: staff_headers
      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['code']).to eq('FORBIDDEN')
    end

    it 'forbids staff from creating invoices' do
      post "/api/v1/memberships/#{membership.id}/invoices",
           params: { invoice: { amount: 100_000 } },
           headers: staff_headers
      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['code']).to eq('FORBIDDEN')
    end
  end

  describe 'Owner role permissions' do
    it 'allows owner to view dashboard' do
      get '/api/v1/dashboard', headers: owner_headers
      expect(response).to have_http_status(:ok)
    end

    it 'allows owner to view settings' do
      get '/api/v1/settings', headers: owner_headers
      expect(response).to have_http_status(:ok)
    end

    it 'allows owner to create packages' do
      post '/api/v1/packages', params: { package: { name: 'Gói VIP', price: 1_000_000, sessions_count: 20 } },
                               headers: owner_headers
      expect(response).to have_http_status(:created)
    end
  end
end
