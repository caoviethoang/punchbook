# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'At-Risk & Re-engagement API', type: :request do
  let(:shop) { Shop.create!(name: 'Retention Club', email: 'club@ret.com', password: 'password123', plan: 'paid') }
  let(:admin) { shop.staffs.create!(name: 'Admin', role: 'admin') }
  let(:package) { shop.packages.create!(name: 'Boxing 30d', price: 1_500_000, duration_days: 30) }
  let!(:at_risk_member) do
    m = CreateMembership.call(
      shop: shop, customer_name: 'Missing Member', phone: '0903000001',
      email: 'missing@example.com', package_id: package.id
    )
    m.update_columns(created_at: 35.days.ago, expires_at: 20.days.from_now.to_date) # rubocop:disable Rails/SkipsModelValidations
    CheckIn.create!(membership: m, checked_in_at: 22.days.ago)
    m
  end

  describe 'GET /api/v1/reports/churn_risk' do
    it 'returns churn risk summary and at-risk members for admin' do
      get '/api/v1/reports/churn_risk', headers: auth_headers(shop, admin)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['summary']['total_at_risk']).to eq(1)
      expect(body['summary']['revenue_at_stake']).to eq(1_500_000)
      expect(body['members'].first['membership_id']).to eq(at_risk_member.id)
    end
  end

  describe 'GET /api/v1/memberships?status=at_risk' do
    it 'filters memberships to only at-risk members' do
      healthy = CreateMembership.call(
        shop: shop, customer_name: 'Active Member', phone: '0903000002', package_id: package.id
      )
      CheckIn.create!(membership: healthy, checked_in_at: 1.day.ago)

      get '/api/v1/memberships', params: { status: 'at_risk' }, headers: auth_headers(shop, admin)

      expect(response).to have_http_status(:ok)
      ids = response.parsed_body['memberships'].pluck('id')
      expect(ids).to eq([at_risk_member.id])
    end
  end

  describe 'POST /api/v1/memberships/:id/send_reengagement' do
    it 'dispatches reengagement notification and updates last_reengagement_sent_at' do
      allow(Notifications::NotificationDispatcher).to receive(:dispatch)
        .and_return([{ success: true, channel: 'email', recipient: 'missing@example.com' }])

      post "/api/v1/memberships/#{at_risk_member.id}/send_reengagement",
           params: { message: 'Quay lai tap nhe!' },
           headers: auth_headers(shop, admin)

      expect(response).to have_http_status(:ok)
      expect(Notifications::NotificationDispatcher).to have_received(:dispatch).with(
        :reengagement,
        shop: shop,
        membership: at_risk_member,
        custom_message: 'Quay lai tap nhe!',
        channels: nil
      )
      expect(at_risk_member.reload.last_reengagement_sent_at).to be_present
    end
  end
end
