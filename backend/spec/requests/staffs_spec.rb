# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Staffs', type: :request do
  let!(:shop) { create_shop(name: 'Test Gym') }
  let!(:admin_staff) { Staff.create!(shop: shop, name: 'Admin Owner', username: 'admin_owner', password: 'password123', role: 'admin') }
  let!(:receptionist) { Staff.create!(shop: shop, name: 'Receptionist Mai', username: 'mai_reception', password: 'password123', role: 'staff') }

  def admin_headers
    token = JsonWebToken.encode({ shop_id: shop.id, staff_id: admin_staff.id, role: 'admin' })
    { 'Authorization' => "Bearer #{token}" }
  end

  def staff_headers
    token = JsonWebToken.encode({ shop_id: shop.id, staff_id: receptionist.id, role: 'staff' })
    { 'Authorization' => "Bearer #{token}" }
  end

  describe 'GET /staffs' do
    it 'returns list of shop staffs' do
      get '/staffs', headers: staff_headers

      expect(response).to have_http_status(:ok)
      body = response.parsed_body['staffs']
      expect(body.size).to eq(2)
      names = body.map { |s| s['name'] }
      expect(names).to include('Admin Owner', 'Receptionist Mai')
    end
  end

  describe 'POST /staffs' do
    it 'allows admin to create a new staff account' do
      post '/staffs', params: {
        staff: {
          name: 'Linh Receptionist',
          username: 'linh_reception',
          password: 'password123',
          role: 'staff'
        }
      }, headers: admin_headers

      expect(response).to have_http_status(:created)
      body = response.parsed_body['staff']
      expect(body['name']).to eq('Linh Receptionist')
      expect(body['username']).to eq('linh_reception')
      expect(body['role']).to eq('staff')
    end

    it 'forbids non-admin staff from creating staff accounts' do
      post '/staffs', params: {
        staff: {
          name: 'Unauthorized Staff',
          username: 'unauth_user',
          password: 'password123',
          role: 'staff'
        }
      }, headers: staff_headers

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['error']).to include('Access denied')
    end
  end

  describe 'DELETE /staffs/:id' do
    it 'allows admin to delete a receptionist account' do
      delete "/staffs/#{receptionist.id}", headers: admin_headers

      expect(response).to have_http_status(:ok)
      expect(Staff.exists?(receptionist.id)).to be false
    end

    it 'prevents admin from deleting their own account' do
      delete "/staffs/#{admin_staff.id}", headers: admin_headers

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['error']).to eq('Cannot delete your own account')
    end
  end
end
