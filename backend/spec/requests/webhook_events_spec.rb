# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'WebhookEvents API', type: :request do
  let!(:shop) { create_shop(name: 'Main Shop', email: 'main@example.com') }
  let!(:other_shop) { create_shop(name: 'Other Shop', email: 'other@example.com') }
  let(:admin_staff) { Staff.create!(shop: shop, name: 'Admin', role: 'admin') }
  let(:regular_staff) { Staff.create!(shop: shop, name: 'Employee', role: 'staff') }

  def create_event(status:, order_code:, shop_ref: shop, last_error: nil, attempts: 1)
    WebhookEvent.create!(
      shop: shop_ref, source: 'payos', status: status, order_code: order_code,
      payload: { 'code' => '00' }, last_error: last_error, attempts: attempts
    )
  end

  describe 'GET /webhook_events' do
    it 'returns 401 when unauthenticated' do
      get '/webhook_events'
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns 403 when user is not an admin' do
      get '/webhook_events', headers: auth_headers(shop, regular_staff)
      expect(response).to have_http_status(:forbidden)
    end

    it 'returns shop-scoped webhook events for admin' do
      event1 = create_event(status: 'success', order_code: 100_001)
      event2 = create_event(status: 'failed', order_code: 100_002, last_error: 'Timeout')
      other_event = create_event(status: 'failed', order_code: 200_001, shop_ref: other_shop)

      get '/webhook_events', headers: auth_headers(shop, admin_staff)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['webhook_events'].size).to eq(2)
      event_ids = body['webhook_events'].pluck('id')
      expect(event_ids).to include(event1.id, event2.id)
      expect(event_ids).not_to include(other_event.id)
      expect(body['meta']['total']).to eq(2)
    end

    it 'filters events by status' do
      create_event(status: 'success', order_code: 100_001)
      dlq_event = create_event(status: 'dead_letter', order_code: 100_003)

      get '/webhook_events', params: { status: 'dead_letter' }, headers: auth_headers(shop, admin_staff)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['webhook_events'].size).to eq(1)
      expect(body['webhook_events'].first['id']).to eq(dlq_event.id)
    end

    it 'supports pagination' do
      3.times { |i| create_event(status: 'success', order_code: 100_000 + i) }

      get '/webhook_events', params: { page: 1, per_page: 2 }, headers: auth_headers(shop, admin_staff)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['webhook_events'].size).to eq(2)
      expect(body['meta']['page']).to eq(1)
      expect(body['meta']['per_page']).to eq(2)
      expect(body['meta']['total']).to eq(3)
    end
  end

  describe 'POST /webhook_events/:id/retry' do
    it 'returns 401 when unauthenticated' do
      event = create_event(status: 'failed', order_code: 100_001)
      post "/webhook_events/#{event.id}/retry"
      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns 403 when user is not an admin' do
      event = create_event(status: 'failed', order_code: 100_001)
      post "/webhook_events/#{event.id}/retry", headers: auth_headers(shop, regular_staff)
      expect(response).to have_http_status(:forbidden)
    end

    it 'returns 404 when attempting to retry an event belonging to another shop' do
      other_event = create_event(status: 'failed', order_code: 200_001, shop_ref: other_shop)
      post "/webhook_events/#{other_event.id}/retry", headers: auth_headers(shop, admin_staff)
      expect(response).to have_http_status(:not_found)
    end

    it 'returns 422 when event is not retryable' do
      success_event = create_event(status: 'success', order_code: 100_001)
      post "/webhook_events/#{success_event.id}/retry", headers: auth_headers(shop, admin_staff)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['error']).to include('not in a retryable state')
    end

    it 'resets status to pending, clears last_error, and enqueues ProcessPayosWebhookJob for failed event' do
      failed_event = create_event(status: 'failed', order_code: 100_002, last_error: 'Timeout')
      allow(ProcessPayosWebhookJob).to receive(:perform_async)

      post "/webhook_events/#{failed_event.id}/retry", headers: auth_headers(shop, admin_staff)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['message']).to eq('Webhook retry successfully enqueued')
      expect(ProcessPayosWebhookJob).to have_received(:perform_async).with(failed_event.id)

      failed_event.reload
      expect(failed_event.status).to eq('pending')
      expect(failed_event.last_error).to be_nil
    end

    it 'allows retrying dead_letter events' do
      dlq_event = create_event(status: 'dead_letter', order_code: 100_003)
      allow(ProcessPayosWebhookJob).to receive(:perform_async)

      post "/webhook_events/#{dlq_event.id}/retry", headers: auth_headers(shop, admin_staff)

      expect(response).to have_http_status(:ok)
      expect(ProcessPayosWebhookJob).to have_received(:perform_async).with(dlq_event.id)
      dlq_event.reload
      expect(dlq_event.status).to eq('pending')
    end
  end
end
