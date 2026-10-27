# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ProcessPayosWebhookJob, type: :job do
  let(:shop) { create_shop }
  let(:package) { Package.create!(shop: shop, name: '10 sessions', sessions_count: 10, price: 500_000) }
  let(:membership) do
    Membership.create!(
      shop: shop, package: package, customer_name: 'Member', phone: '0901111111', sessions_left: 2
    )
  end
  let(:invoice) do
    Invoice.create!(membership: membership, amount: 500_000, status: 'pending', payos_order_code: 123_456)
  end

  let(:valid_payload) do
    {
      'code' => '00',
      'desc' => 'success',
      'data' => {
        'orderCode' => invoice.payos_order_code,
        'amount' => 500_000,
        'code' => '00'
      },
      'signature' => 'mock_signature'
    }
  end

  describe '#perform' do
    it 'does nothing if webhook event does not exist' do
      expect { described_class.new.perform('non-existent-id') }.not_to raise_error
    end

    it 'does nothing if webhook event is already success' do
      event = WebhookEvent.create!(
        shop: shop, source: 'payos', status: 'success', payload: valid_payload, order_code: invoice.payos_order_code
      )

      allow(ProcessPayosWebhook).to receive(:call)
      described_class.new.perform(event.id)
      expect(ProcessPayosWebhook).not_to have_received(:call)
    end

    it 'processes event successfully and updates status to success' do
      event = WebhookEvent.create!(
        shop: shop, source: 'payos', status: 'pending', payload: valid_payload, order_code: invoice.payos_order_code
      )

      allow(ProcessPayosWebhook).to receive(:call).with(valid_payload).and_return([true, :success])

      described_class.new.perform(event.id)

      event.reload
      expect(event.status).to eq('success')
      expect(event.processed_at).to be_present
      expect(event.attempts).to eq(1)
      expect(event.last_error).to be_nil
    end

    it 'relinks shop if event.shop_id is nil and target is found' do
      event = WebhookEvent.create!(
        shop: nil, source: 'payos', status: 'pending', payload: valid_payload, order_code: invoice.payos_order_code
      )

      allow(ProcessPayosWebhook).to receive(:call).with(valid_payload).and_return([true, :success])

      described_class.new.perform(event.id)

      event.reload
      expect(event.shop).to eq(shop)
      expect(event.status).to eq('success')
    end

    it 'records failure and raises error when ProcessPayosWebhook returns false' do
      event = WebhookEvent.create!(
        shop: shop, source: 'payos', status: 'pending', payload: valid_payload, order_code: invoice.payos_order_code
      )

      allow(ProcessPayosWebhook).to receive(:call).with(valid_payload).and_return([false, :invoice_not_found])

      expect do
        described_class.new.perform(event.id)
      end.to raise_error(StandardError, /Webhook processing failed with status: invoice_not_found/)

      event.reload
      expect(event.status).to eq('failed')
      expect(event.attempts).to eq(1)
      expect(event.last_error).to include('invoice_not_found')
      expect(event.failed_at).to be_present
    end

    it 'records failure and re-raises unexpected exceptions' do
      event = WebhookEvent.create!(
        shop: shop, source: 'payos', status: 'pending', payload: valid_payload, order_code: invoice.payos_order_code
      )

      allow(ProcessPayosWebhook).to receive(:call).and_raise(ActiveRecord::ConnectionTimeoutError, 'DB locked')

      expect do
        described_class.new.perform(event.id)
      end.to raise_error(ActiveRecord::ConnectionTimeoutError)

      event.reload
      expect(event.status).to eq('failed')
      expect(event.last_error).to eq('DB locked')
    end
  end

  describe 'sidekiq_retries_exhausted hook' do
    it 'moves webhook event to dead-letter queue and logs warning' do
      event = WebhookEvent.create!(
        shop: shop, source: 'payos', status: 'failed', payload: valid_payload,
        order_code: invoice.payos_order_code, attempts: 5
      )

      msg = { 'args' => [event.id] }
      exception = StandardError.new('Connection timeout')

      allow(Rails.logger).to receive(:warn)

      described_class.sidekiq_retries_exhausted_block.call(msg, exception)

      expect(Rails.logger).to have_received(:warn).with(/moved to dead-letter queue/)
      event.reload
      expect(event.status).to eq('dead_letter')
      expect(event.last_error).to include('Retries exhausted: Connection timeout')
      expect(event.failed_at).to be_present
    end
  end
end
