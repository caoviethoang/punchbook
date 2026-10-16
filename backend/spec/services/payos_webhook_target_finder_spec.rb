# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PayosWebhookTargetFinder do
  let!(:shop) { create_shop }
  let!(:package) do
    Package.create!(shop: shop, name: '10 sessions', sessions_count: 10, price: 500_000)
  end
  let!(:membership) do
    Membership.create!(
      shop: shop, package: package, customer_name: 'Member 1', phone: '0901111111', sessions_left: 5
    )
  end

  describe '.call' do
    it 'returns nil when order_code is blank' do
      expect(described_class.call(nil)).to be_nil
      expect(described_class.call('')).to be_nil
    end

    it 'finds invoice by numeric payos_order_code' do
      invoice = Invoice.create!(membership: membership, amount: 500_000, payos_order_code: 123_456)

      expect(described_class.call(123_456)).to eq(invoice)
      expect(described_class.call('123456')).to eq(invoice)
    end

    it 'finds invoice by id' do
      invoice = Invoice.create!(membership: membership, amount: 500_000)

      expect(described_class.call(invoice.id)).to eq(invoice)
    end

    it 'finds shop_plan_payment by numeric payos_order_code' do
      payment = shop.shop_plan_payments.create!(amount: 199_000, months: 1, payos_order_code: 789_012)

      expect(described_class.call(789_012)).to eq(payment)
    end

    it 'creates fallback payment when order_code matches shop id prefix' do
      prefix = shop.id.to_s[0..7]

      payment = described_class.call(prefix, { amount: 199_000 })
      expect(payment).to be_a(ShopPlanPayment)
      expect(payment.shop).to eq(shop)
      expect(payment.amount).to eq(199_000)
      expect(payment.months).to eq(1)
    end
  end
end
