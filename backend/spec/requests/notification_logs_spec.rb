# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'NotificationLogs API', type: :request do
  let(:shop) { create_shop(name: 'Yoga Spa', email: 'owner@spa.vn') }
  let(:headers) { auth_headers(shop) }
  let(:package) { Package.create!(shop: shop, name: 'Yoga 10', sessions_count: 10, price: 300_000) }
  let(:membership) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'Lan Anh',
      phone: '0909090909',
      email: 'lananh@spa.vn'
    )
  end

  describe 'GET /api/v1/notification_logs' do
    before do
      NotificationLog.create!(
        shop: shop,
        membership: membership,
        channel: 'email',
        event_type: 'welcome',
        recipient: 'lananh@spa.vn',
        status: 'sent'
      )
      NotificationLog.create!(
        shop: shop,
        membership: membership,
        channel: 'sms',
        event_type: 'expiring_reminder',
        recipient: '0909090909',
        status: 'failed',
        error_message: 'Gateway down'
      )
      other_shop = create_shop(name: 'Other', email: 'other@shop.vn')
      NotificationLog.create!(
        shop: other_shop,
        channel: 'email',
        event_type: 'welcome',
        recipient: 'other@user.vn',
        status: 'sent'
      )
    end

    it 'returns shop notification logs with pagination meta' do
      get '/api/v1/notification_logs', headers: headers

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['notification_logs'].size).to eq(2)
      expect(body['meta']['total']).to eq(2)
      expect(body['meta']['page']).to eq(1)
    end

    it 'filters logs by channel' do
      get '/api/v1/notification_logs', params: { channel: 'sms' }, headers: headers

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['notification_logs'].size).to eq(1)
      expect(body['notification_logs'].first['channel']).to eq('sms')
    end
  end

  describe 'POST /api/v1/notification_logs/test' do
    before do
      allow(Notifications::NotificationDispatcher).to receive(:dispatch).and_return(
        [{ success: true, channel: 'email', recipient: 'test@spa.vn' }]
      )
    end

    it 'dispatches a test notification' do
      post '/api/v1/notification_logs/test', params: { channel: 'email', recipient: 'test@spa.vn' }, headers: headers

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['message']).to include('thành công')
      expect(Notifications::NotificationDispatcher).to have_received(:dispatch).with(
        :welcome,
        shop: shop,
        membership: anything,
        channels: ['email']
      )
    end
  end
end
