# frozen_string_literal: true

require 'rails_helper'

# rubocop:disable RSpec/MultipleMemoizedHelpers
RSpec.describe ZaloService do
  subject(:service) { described_class.new }

  let(:app_id) { '123456789' }
  let(:app_secret) { 'supersecret' }
  let(:template_id) { 'template_id_123' }
  let(:memory_store) { ActiveSupport::Cache.lookup_store(:memory_store) }

  before do
    allow(Rails).to receive(:cache).and_return(memory_store)
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with('ZALO_APP_ID', '').and_return(app_id)
    allow(ENV).to receive(:fetch).with('ZALO_APP_SECRET', '').and_return(app_secret)
    allow(ENV).to receive(:fetch).with('ZALO_REFRESH_TOKEN', nil).and_return('initial_refresh_token')
    allow(ENV).to receive(:fetch).with('ZALO_TEMPLATE_ID_MEMBERSHIP_REMINDER', '').and_return(template_id)

    Rails.cache.clear
  end

  describe '#normalize_phone' do
    it 'converts 09xxxx to 849xxxx' do
      expect(service.normalize_phone('0912345678')).to eq('84912345678')
    end

    it 'converts +849xxxx to 849xxxx' do
      expect(service.normalize_phone('+84912345678')).to eq('84912345678')
    end

    it 'keeps 849xxxx as is' do
      expect(service.normalize_phone('84912345678')).to eq('84912345678')
    end

    it 'strips non-numeric characters' do
      expect(service.normalize_phone('091-234-5678')).to eq('84912345678')
    end
  end

  describe '#refresh_access_token!' do
    context 'when refresh token is present' do
      it 'calls Zalo OAuth API and caches access and refresh tokens' do
        stub_request(:post, 'https://oauth.zaloapp.com/v4/oa/access_token')
          .with(
            body: { 'app_id' => app_id, 'grant_type' => 'refresh_token', 'refresh_token' => 'initial_refresh_token' },
            headers: { 'Content-Type' => 'application/x-www-form-urlencoded', 'Secret-Key' => app_secret }
          )
          .to_return(
            status: 200,
            body: { access_token: 'new_access_token', refresh_token: 'new_refresh_token', expires_in: '90000' }.to_json,
            headers: { 'Content-Type' => 'application/json' }
          )

        token = service.refresh_access_token!
        expect(token).to eq('new_access_token')
        expect(Rails.cache.read('zalo_access_token')).to eq('new_access_token')
        expect(Rails.cache.read('zalo_refresh_token')).to eq('new_refresh_token')
      end
    end

    context 'when refresh token is blank' do
      before do
        allow(ENV).to receive(:fetch).with('ZALO_REFRESH_TOKEN', nil).and_return(nil)
      end

      it 'raises an error' do
        expect { service.refresh_access_token! }
          .to raise_error(ZaloService::Error, /No refresh token available/)
      end
    end

    context 'when API call fails' do
      it 'raises an error with response details' do
        stub_request(:post, 'https://oauth.zaloapp.com/v4/oa/access_token')
          .to_return(status: 400, body: 'Bad Request')

        expect { service.refresh_access_token! }
          .to raise_error(ZaloService::Error, /Failed to refresh Zalo access token/)
      end
    end
  end

  describe '#send_template_message' do
    let(:phone) { '0912345678' }
    let(:template_data) { { 'customer_name' => 'John Doe' } }

    context 'when access token is cached' do
      before do
        Rails.cache.write('zalo_access_token', 'cached_token')
      end

      it 'sends the message using the cached token' do
        stub_request(:post, 'https://business.openapi.zalo.me/message/template')
          .with(
            body: { phone: '84912345678', template_id: template_id, template_data: template_data }.to_json,
            headers: { 'Content-Type' => 'application/json', 'Access-Token' => 'cached_token' }
          )
          .to_return(
            status: 200,
            body: { error: 0, message: 'Success', data: { msg_id: '123' } }.to_json
          )

        res = service.send_template_message(phone: phone, template_id: template_id, template_data: template_data)
        expect(res['error']).to eq(0)
      end
    end

    context 'when access token is not cached' do
      it 'refreshes the token and then sends the message' do
        # 1. Refresh token call
        stub_request(:post, 'https://oauth.zaloapp.com/v4/oa/access_token')
          .to_return(
            status: 200,
            body: { access_token: 'fresh_token', refresh_token: 'next_refresh_token', expires_in: '90000' }.to_json
          )

        # 2. Send message call
        stub_request(:post, 'https://business.openapi.zalo.me/message/template')
          .with(headers: { 'Access-Token' => 'fresh_token' })
          .to_return(
            status: 200,
            body: { error: 0, message: 'Success', data: { msg_id: '123' } }.to_json
          )

        res = service.send_template_message(phone: phone, template_id: template_id, template_data: template_data)
        expect(res['error']).to eq(0)
        expect(Rails.cache.read('zalo_access_token')).to eq('fresh_token')
        expect(Rails.cache.read('zalo_refresh_token')).to eq('next_refresh_token')
      end
    end

    context 'when access token is expired / invalid (error -117)' do
      before do
        Rails.cache.write('zalo_access_token', 'expired_token')
        Rails.cache.write('zalo_refresh_token', 'current_refresh_token')
      end

      it 'automatically refreshes token and retries the request' do
        # First send attempt returns token error (-117)
        stub_request(:post, 'https://business.openapi.zalo.me/message/template')
          .with(headers: { 'Access-Token' => 'expired_token' })
          .to_return(
            status: 200,
            body: { error: -117, message: 'Access token invalid or expired' }.to_json
          )

        # Token refresh call
        stub_request(:post, 'https://oauth.zaloapp.com/v4/oa/access_token')
          .with(body: hash_including({ 'refresh_token' => 'current_refresh_token' }))
          .to_return(
            status: 200,
            body: { access_token: 'new_token', refresh_token: 'new_refresh_token', expires_in: '90000' }.to_json
          )

        # Second send attempt succeeds
        stub_request(:post, 'https://business.openapi.zalo.me/message/template')
          .with(headers: { 'Access-Token' => 'new_token' })
          .to_return(
            status: 200,
            body: { error: 0, message: 'Success', data: { msg_id: '123' } }.to_json
          )

        res = service.send_template_message(phone: phone, template_id: template_id, template_data: template_data)
        expect(res['error']).to eq(0)
        expect(Rails.cache.read('zalo_access_token')).to eq('new_token')
        expect(Rails.cache.read('zalo_refresh_token')).to eq('new_refresh_token')
      end
    end

    context 'when API response indicates parameter or other template error' do
      before do
        Rails.cache.write('zalo_access_token', 'valid_token')
      end

      it 'raises a Zalo ZBS error' do
        stub_request(:post, 'https://business.openapi.zalo.me/message/template')
          .to_return(
            status: 200,
            body: { error: -108, message: 'Phone number invalid' }.to_json
          )

        expect do
          service.send_template_message(phone: phone, template_id: template_id, template_data: template_data)
        end.to raise_error(ZaloService::Error, /Zalo ZBS Error \[-108\]: Phone number invalid/)
      end
    end
  end
end
# rubocop:enable RSpec/MultipleMemoizedHelpers
