# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'PayOS Webhook API', type: :request do
  let(:checksum_key) { 'test_checksum_key' }
  let!(:shop) { create_shop }

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with('PAYOS_CHECKSUM_KEY', '').and_return(checksum_key)
  end

  def create_session_fixture(sessions_left: 2)
    package = Package.create!(shop: shop, name: '10 sessions', sessions_count: 10, price: 500_000)
    membership = Membership.create!(
      shop: shop, package: package, customer_name: 'Member 1', phone: '0901111111', sessions_left: sessions_left
    )
    invoice = Invoice.create!(membership: membership, amount: 500_000, status: 'pending')
    [membership, invoice]
  end

  def create_day_fixture(expires_at: Date.current + 5.days)
    package = Package.create!(shop: shop, name: '30 days', duration_days: 30, price: 800_000)
    membership = Membership.create!(
      shop: shop, package: package, customer_name: 'Member 2', phone: '0902222222', expires_at: expires_at
    )
    invoice = Invoice.create!(membership: membership, amount: 800_000, status: 'pending')
    [membership, invoice]
  end

  def compute_signature(data_hash, key = checksum_key)
    sorted_keys = data_hash.keys.map(&:to_s).sort
    data_string = sorted_keys.map do |k|
      val = data_hash[k] || data_hash[k.to_sym]
      "#{k}=#{val}"
    end.join('&')

    OpenSSL::HMAC.hexdigest('sha256', key, data_string)
  end

  describe 'POST /webhooks/payos' do
    context 'when signature is missing' do
      it 'rejects request with 400 bad_request and makes no DB changes' do
        membership, invoice = create_session_fixture
        payload = {
          code: '00',
          desc: 'success',
          data: { orderCode: invoice.id, amount: 500_000, code: '00' }
        }

        post '/webhooks/payos', params: payload

        expect(response).to have_http_status(:bad_request)
        expect(response.parsed_body['error']).to eq('Invalid signature')

        invoice.reload
        membership.reload
        expect(invoice.status).to eq('pending')
        expect(membership.sessions_left).to eq(2)
      end
    end

    context 'when signature is invalid' do
      it 'rejects request with 400 bad_request and makes no DB changes' do
        membership, invoice = create_session_fixture
        payload = {
          code: '00',
          desc: 'success',
          data: { orderCode: invoice.id, amount: 500_000, code: '00' },
          signature: 'wrong_signature_123'
        }

        post '/webhooks/payos', params: payload

        expect(response).to have_http_status(:bad_request)
        expect(response.parsed_body['error']).to eq('Invalid signature')

        invoice.reload
        membership.reload
        expect(invoice.status).to eq('pending')
        expect(membership.sessions_left).to eq(2)
      end
    end

    context 'when signature is valid and payment succeeded for session-based package' do
      it 'marks invoice as paid and increments sessions_left' do
        membership, invoice = create_session_fixture
        data = { orderCode: invoice.id, amount: 500_000, code: '00' }
        signature = compute_signature(data)

        payload = { code: '00', desc: 'success', data: data, signature: signature }

        post '/webhooks/payos', params: payload, as: :json

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['status']).to eq('success')

        invoice.reload
        membership.reload
        expect(invoice.status).to eq('paid')
        expect(membership.sessions_left).to eq(12)
      end
    end

    context 'when signature is valid and payment succeeded for day-based package' do
      it 'marks invoice as paid and extends expires_at' do
        membership, invoice = create_day_fixture
        data = { orderCode: invoice.id, amount: 800_000, code: '00' }
        signature = compute_signature(data)

        payload = { code: '00', desc: 'success', data: data, signature: signature }

        post '/webhooks/payos', params: payload, as: :json

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['status']).to eq('success')

        invoice.reload
        membership.reload
        expect(invoice.status).to eq('paid')
        expect(membership.expires_at).to eq(Date.current + 35.days)
      end
    end

    context 'when webhook is received again for an already paid invoice (idempotency)' do
      it 'returns 200 ok without duplicate session renewal' do
        membership, invoice = create_session_fixture
        invoice.update!(status: 'paid')

        data = { orderCode: invoice.id, amount: 500_000, code: '00' }
        signature = compute_signature(data)

        payload = { code: '00', desc: 'success', data: data, signature: signature }

        expect do
          post('/webhooks/payos', params: payload, as: :json)
        end.not_to(change { membership.reload.sessions_left })

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['status']).to eq('success')
      end
    end

    context 'when invoice is not found' do
      it 'returns 422 unprocessable_content' do
        data = { orderCode: 999_999, amount: 500_000, code: '00' }
        signature = compute_signature(data)

        payload = { code: '00', desc: 'success', data: data, signature: signature }

        post '/webhooks/payos', params: payload, as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body['error']).to eq('Webhook processing failed')
      end
    end

    context 'when signature is valid but payment response code indicates failure' do
      it 'does not mark invoice as paid or renew membership' do
        membership, invoice = create_session_fixture
        data = { orderCode: invoice.id, amount: 500_000, code: '01' }
        signature = compute_signature(data)

        payload = { code: '01', desc: 'failed', data: data, signature: signature }

        post '/webhooks/payos', params: payload, as: :json

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body['status']).to eq('success')

        invoice.reload
        membership.reload
        expect(invoice.status).to eq('pending')
        expect(membership.sessions_left).to eq(2)
      end
    end
  end
end
