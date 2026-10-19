# frozen_string_literal: true

# Finds invoice or shop plan payment associated with a payOS webhook order code.
class PayosWebhookTargetFinder
  def self.call(order_code, data_hash = {})
    new(order_code, data_hash).call
  end

  def initialize(order_code, data_hash = {})
    @order_code = order_code
    @data_hash = data_hash
  end

  def call
    find_invoice || find_shop_plan_payment
  end

  def find_invoice
    return nil if order_code.blank?

    numeric_order_code? ? Invoice.find_by(payos_order_code: order_code) : Invoice.find_by(id: order_code)
  end

  def find_shop_plan_payment
    return nil if order_code.blank?

    payment = find_payment_by_code
    return payment if payment.present?

    create_fallback_payment_for_shop
  end

  private

  attr_reader :order_code, :data_hash

  def find_payment_by_code
    if numeric_order_code?
      ShopPlanPayment.find_by(payos_order_code: order_code)
    else
      ShopPlanPayment.find_by(id: order_code)
    end
  end

  def numeric_order_code?
    order_code.to_s.match?(/\A\d+\z/)
  end

  def create_fallback_payment_for_shop
    shop = Shop.find_by('id::text ILIKE ?', "#{order_code}%")
    return nil if shop.nil?

    amount = (data_hash['amount'] || data_hash[:amount] || 199_000).to_i
    months = amount >= 1_990_000 ? 12 : 1
    shop.shop_plan_payments.create!(amount: amount, months: months, status: 'pending')
  end
end
