# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Trainer Commissions & PT Permissions API', type: :request do
  let(:shop) { Shop.create!(name: 'Boxing PT Club', email: 'club@pt.com', password: 'password123', plan: 'paid') }
  let(:admin) { shop.staffs.create!(name: 'Owner Admin', role: 'admin') }
  let(:pt_kiet) { shop.staffs.create!(name: 'HLV Kiet', role: 'trainer') }
  let(:pt_package) do
    shop.packages.create!(
      name: 'PT 10 Sessions', price: 5_000_000, sessions_count: 10,
      pt_package: true, commission_type: 'flat', commission_rate: 150_000, sale_commission_rate: 10
    )
  end

  describe 'GET /api/v1/staffs/trainers' do
    it 'allows receptionist and trainers to list available trainers' do
      receptionist = shop.staffs.create!(name: 'Front Desk', role: 'staff')
      admin
      pt_kiet

      get '/api/v1/staffs/trainers', headers: auth_headers(shop, receptionist)

      expect(response).to have_http_status(:ok)
      ids = response.parsed_body['trainers'].pluck('id')
      expect(ids).to include(admin.id, pt_kiet.id)
      expect(ids).not_to include(receptionist.id)
    end
  end

  describe 'GET /api/v1/reports/trainer_commissions' do
    before do
      receptionist = shop.staffs.create!(name: 'Front Desk', role: 'staff')
      client_kiet = CreateMembership.call(
        shop: shop, customer_name: 'Hoc vien Kiet', phone: '0909001001',
        package_id: pt_package.id, assigned_staff_id: pt_kiet.id
      )
      CheckInMembership.call(membership: client_kiet, staff: receptionist)
    end

    it 'allows admin to view all trainer commission reports' do
      pt_lan = shop.staffs.create!(name: 'HLV Lan', role: 'trainer')
      get '/api/v1/reports/trainer_commissions', headers: auth_headers(shop, admin)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['summary']['total_sessions_completed']).to eq(1)
      expect(body['summary']['total_session_commission']).to eq(150_000)
      expect(body['trainers'].pluck('trainer_id')).to include(pt_kiet.id, pt_lan.id)
    end

    it 'allows trainer to view only their own commission report' do
      get '/api/v1/reports/trainer_commissions', headers: auth_headers(shop, pt_kiet)

      expect(response).to have_http_status(:ok)
      trainers = response.parsed_body['trainers']
      expect(trainers.size).to eq(1)
      expect(trainers.first['trainer_id']).to eq(pt_kiet.id)
    end

    it 'forbids trainer from viewing another trainer commission report' do
      pt_lan = shop.staffs.create!(name: 'HLV Lan', role: 'trainer')
      get '/api/v1/reports/trainer_commissions', params: { trainer_id: pt_lan.id }, headers: auth_headers(shop, pt_kiet)

      expect(response).to have_http_status(:forbidden)
    end

    it 'forbids regular receptionist from viewing commission reports' do
      receptionist = shop.staffs.find_by!(role: 'staff')
      get '/api/v1/reports/trainer_commissions', headers: auth_headers(shop, receptionist)

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'GET /api/v1/reports/trainer_commissions/export' do
    it 'exports excel file for admin on paid plan' do
      pt_kiet
      get '/api/v1/reports/trainer_commissions/export', headers: auth_headers(shop, admin)

      expect(response).to have_http_status(:ok)
      expect(response.headers['Content-Type']).to include('spreadsheetml.sheet')
    end

    it 'forbids export on free plan' do
      shop.update!(plan: 'free')
      get '/api/v1/reports/trainer_commissions/export', headers: auth_headers(shop, admin)

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'Trainer client access restrictions' do
    let!(:client_kiet) do
      CreateMembership.call(
        shop: shop, customer_name: 'Hoc vien Kiet', phone: '0909001001',
        package_id: pt_package.id, assigned_staff_id: pt_kiet.id
      )
    end

    it 'filters GET /api/v1/memberships to only assigned clients for trainers' do
      pt_lan = shop.staffs.create!(name: 'HLV Lan', role: 'trainer')
      CreateMembership.call(
        shop: shop, customer_name: 'Hoc vien Lan', phone: '0909001002',
        package_id: pt_package.id, assigned_staff_id: pt_lan.id
      )

      get '/api/v1/memberships', headers: auth_headers(shop, pt_kiet)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['memberships'].pluck('customer_name')).to eq(['Hoc vien Kiet'])
    end

    it 'forbids trainer from viewing or checking in unassigned clients' do
      pt_lan = shop.staffs.create!(name: 'HLV Lan', role: 'trainer')
      client_lan = CreateMembership.call(
        shop: shop, customer_name: 'Hoc vien Lan', phone: '0909001002',
        package_id: pt_package.id, assigned_staff_id: pt_lan.id
      )

      get "/api/v1/memberships/#{client_lan.id}", headers: auth_headers(shop, pt_kiet)
      expect(response).to have_http_status(:forbidden)

      post "/api/v1/memberships/#{client_lan.id}/check_in", headers: auth_headers(shop, pt_kiet)
      expect(response).to have_http_status(:forbidden)
    end

    it 'allows trainer to view and check in their own assigned client' do
      get "/api/v1/memberships/#{client_kiet.id}", headers: auth_headers(shop, pt_kiet)
      expect(response).to have_http_status(:ok)

      post "/api/v1/memberships/#{client_kiet.id}/check_in", headers: auth_headers(shop, pt_kiet)
      expect(response).to have_http_status(:ok)
      expect(CheckIn.last.trainer_id).to eq(pt_kiet.id)
    end
  end
end
