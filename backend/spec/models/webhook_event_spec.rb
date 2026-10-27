# frozen_string_literal: true

require 'rails_helper'

RSpec.describe WebhookEvent, type: :model do
  let(:shop) { create_shop }

  describe 'validations' do
    it 'is valid with valid attributes' do
      event = described_class.new(source: 'payos', status: 'pending', payload: {})
      expect(event).to be_valid
    end

    it 'is invalid without source' do
      event = described_class.new(source: nil, status: 'pending')
      expect(event).not_to be_valid
    end

    it 'is invalid with invalid status' do
      event = described_class.new(source: 'payos', status: 'unknown_status')
      expect(event).not_to be_valid
    end
  end

  describe '#retryable?' do
    it 'returns true for failed and dead_letter' do
      failed_event = described_class.new(status: 'failed')
      dead_letter_event = described_class.new(status: 'dead_letter')

      expect(failed_event.retryable?).to be true
      expect(dead_letter_event.retryable?).to be true
    end

    it 'returns false for success, pending, invalid_signature' do
      expect(described_class.new(status: 'success').retryable?).to be false
      expect(described_class.new(status: 'pending').retryable?).to be false
      expect(described_class.new(status: 'invalid_signature').retryable?).to be false
    end
  end

  describe 'status transition methods' do
    let(:event) { described_class.create!(source: 'payos', status: 'pending', payload: {}) }

    it 'marks success' do
      event.mark_success!
      expect(event.status).to eq('success')
      expect(event.processed_at).to be_present
      expect(event.last_error).to be_nil
    end

    it 'marks failed' do
      event.mark_failed!('Some error')
      expect(event.status).to eq('failed')
      expect(event.failed_at).to be_present
      expect(event.last_error).to eq('Some error')
    end

    it 'marks dead letter' do
      event.mark_dead_letter!('5 retries exhausted')
      expect(event.status).to eq('dead_letter')
      expect(event.failed_at).to be_present
      expect(event.last_error).to eq('5 retries exhausted')
    end

    it 'marks invalid signature' do
      event.mark_invalid_signature!('Bad HMAC')
      expect(event.status).to eq('invalid_signature')
      expect(event.failed_at).to be_present
      expect(event.last_error).to eq('Bad HMAC')
    end
  end

  describe '.for_shop' do
    let(:other_shop) { create_shop(name: 'Other Shop') }
    let(:package) { Package.create!(shop: shop, name: 'Pkg', price: 100_000, sessions_count: 10) }
    let(:membership) { Membership.create!(shop: shop, package: package, customer_name: 'A', phone: '0901') }
    let(:invoice) do
      Invoice.create!(membership: membership, amount: 100_000, status: 'pending', payos_order_code: 111_222)
    end

    it 'returns events directly associated with shop' do
      event = described_class.create!(shop: shop, source: 'payos', status: 'pending')
      other_event = described_class.create!(shop: other_shop, source: 'payos', status: 'pending')

      expect(described_class.for_shop(shop)).to include(event)
      expect(described_class.for_shop(shop)).not_to include(other_event)
    end

    it 'returns events with matching order_code when shop_id is nil' do
      event = described_class.create!(
        shop: nil, order_code: invoice.payos_order_code, source: 'payos', status: 'pending'
      )

      expect(described_class.for_shop(shop)).to include(event)
      expect(described_class.for_shop(other_shop)).not_to include(event)
    end
  end

  describe '.resolve_shop_from_payload' do
    let(:package) { Package.create!(shop: shop, name: 'Pkg', price: 100_000, sessions_count: 10) }
    let(:membership) { Membership.create!(shop: shop, package: package, customer_name: 'A', phone: '0901') }
    let(:invoice) do
      Invoice.create!(membership: membership, amount: 100_000, status: 'pending', payos_order_code: 555_666)
    end

    it 'resolves shop from invoice orderCode' do
      payload = { 'data' => { 'orderCode' => invoice.payos_order_code } }
      expect(described_class.resolve_shop_from_payload(payload)).to eq(shop)
    end

    it 'resolves shop from shop plan payment orderCode' do
      payment = ShopPlanPayment.create!(shop: shop, amount: 199_000, months: 1, payos_order_code: 777_888)
      payload = { 'data' => { 'orderCode' => payment.payos_order_code } }
      expect(described_class.resolve_shop_from_payload(payload)).to eq(shop)
    end

    it 'returns nil when payload is invalid or target not found' do
      expect(described_class.resolve_shop_from_payload(nil)).to be_nil
      expect(described_class.resolve_shop_from_payload({})).to be_nil
      expect(described_class.resolve_shop_from_payload({ 'data' => { 'orderCode' => 999_999 } })).to be_nil
    end
  end
end
