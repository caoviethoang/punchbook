# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Member Self-Service Portal API', type: :request do
  let(:shop) do
    Shop.create!(
      name: 'Alpha Gym', email: 'alpha@gym.com', password: 'password123',
      bank_name: 'TPBank', bank_account_no: '0123456789', bank_account_name: 'ALPHA GYM'
    )
  end
  let(:other_shop) { Shop.create!(name: 'Beta Gym', email: 'beta@gym.com', password: 'password123') }
  let(:package) { shop.packages.create!(name: 'Boxing 10', price: 1_500_000, sessions_count: 10) }
  let(:other_package) { other_shop.packages.create!(name: 'Beta Pack', price: 900_000, duration_days: 30) }
  let(:member) do
    CreateMembership.call(shop: shop, customer_name: 'Nguyen Van A', phone: '0901112233', package_id: package.id)
  end

  describe 'authentication boundaries' do
    it 'returns 401 when token is missing' do
      get '/api/v1/member_portal/profile'

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['code']).to eq('UNAUTHORIZED')
    end

    it 'returns 404 when token is invalid or membership is discarded' do
      get '/api/v1/member_portal/profile', headers: { 'X-Member-Token' => 'invalid-token-123' }
      expect(response).to have_http_status(:not_found)

      member.discard
      get '/api/v1/member_portal/profile', headers: { 'X-Member-Token' => member.public_token }
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'GET /api/v1/member_portal/profile' do
    it 'returns member profile, QR data, and shop packages strictly scoped to token owner' do
      other_package
      get '/api/v1/member_portal/profile', headers: { 'X-Member-Token' => member.public_token }

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['member']['id']).to eq(member.id)
      expect(body['member']['customer_name']).to eq('Nguyen Van A')
      expect(body['member']['qr_code_value']).to eq("PUNCHBOOK:#{member.id}")
      expect(body['member']['shop']['name']).to eq('Alpha Gym')
      expect(body['available_packages'].pluck('id')).to eq([package.id])
    end
  end

  describe 'GET /api/v1/member_portal/history' do
    it 'returns only the authenticated member check-ins and invoices without leaking other members data' do
      other_member = CreateMembership.call(
        shop: shop, customer_name: 'Other Member', phone: '0909998888', package_id: package.id
      )
      CheckIn.create!(membership: member, checked_in_at: Time.current)
      CheckIn.create!(membership: other_member, checked_in_at: Time.current)
      member.invoices.create!(amount: 1_500_000, status: 'paid')
      other_member.invoices.create!(amount: 999_000, status: 'paid')

      get '/api/v1/member_portal/history', params: { token: member.public_token }

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['check_ins'].size).to eq(1)
      expect(body['invoices'].size).to eq(1)
      expect(body['invoices'].first['amount']).to eq(1_500_000)
    end
  end

  describe 'POST /api/v1/member_portal/renew' do
    it 'generates a payOS checkout link and pending invoice for self-renewal' do
      payos_result = PayosService::Result.new(
        payment_link_id: 'pl-portal-123',
        checkout_url: 'https://pay.payos.vn/web/portal123',
        qr_code: '000201010212...'
      )
      allow(PayosService).to receive(:create_payment_link).and_return(payos_result)

      post '/api/v1/member_portal/renew', headers: { 'X-Member-Token' => member.public_token }

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body['invoice']['amount']).to eq(1_500_000)
      expect(body['invoice']['status']).to eq('pending')
      expect(body['payos']['checkout_url']).to eq('https://pay.payos.vn/web/portal123')
      expect(body['payos']['qr_code']).to eq('000201010212...')
    end

    it 'returns 404 when attempting to renew with a package from another shop' do
      post '/api/v1/member_portal/renew',
           params: { package_id: other_package.id },
           headers: { 'X-Member-Token' => member.public_token }

      expect(response).to have_http_status(:not_found)
    end
  end
end
