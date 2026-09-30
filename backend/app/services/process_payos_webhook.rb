# frozen_string_literal: true

# Service object for handling payOS webhook payloads.
# Verifies HMAC signature before making any database updates.
# rubocop:disable Metrics/ClassLength
class ProcessPayosWebhook
  def self.call(payload)
    new(payload).call
  end

  def initialize(payload)
    @payload = payload.respond_to?(:to_unsafe_h) ? payload.to_unsafe_h : payload.to_h
  end

  def call
    return [false, :invalid_signature] unless valid_signature?

    invoice = find_invoice
    shop_plan_payment = find_shop_plan_payment

    return [false, :invoice_not_found] if invoice.nil? && shop_plan_payment.nil?

    if invoice.present?
      process_invoice(invoice)
    else
      process_shop_plan_payment(shop_plan_payment)
    end
  end

  private

  attr_reader :payload

  def valid_signature?
    PayosService.verify_webhook_signature?(data, signature)
  end

  def signature
    payload['signature'] || payload[:signature]
  end

  def data
    payload['data'] || payload[:data]
  end

  def data_hash
    @data_hash ||= data.respond_to?(:to_unsafe_h) ? data.to_unsafe_h : data.to_h
  end

  def order_code
    data_hash['orderCode'] || data_hash[:orderCode]
  end

  def response_code
    data_hash['code'] || data_hash[:code] || payload['code'] || payload[:code]
  end

  def find_invoice
    return nil if order_code.blank?

    if numeric_order_code?
      Invoice.find_by(payos_order_code: order_code)
    else
      Invoice.find_by(id: order_code)
    end
  end

  def find_shop_plan_payment
    return nil if order_code.blank?

    payment = find_payment_by_code
    return payment if payment.present?

    create_fallback_payment_for_shop
  end

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

  def process_invoice(invoice)
    return [true, :already_processed] if invoice.status == 'paid'
    return [true, :payment_not_successful] unless response_code == '00'

    Invoice.transaction do
      execute_renewal_and_log!(invoice)
    end
    [true, :success]
  end

  def process_shop_plan_payment(payment)
    return [true, :already_processed] if payment.status == 'paid'
    return [true, :payment_not_successful] unless response_code == '00'

    ShopPlanPayment.transaction do
      execute_shop_upgrade_and_log!(payment)
    end
    [true, :success]
  end

  def execute_renewal_and_log!(invoice)
    membership = invoice.membership
    sessions_before = membership.sessions_left
    expires_at_before = membership.expires_at

    invoice.update!(status: 'paid')
    membership.renew!

    AuditLog.log_membership_renewed!(
      shop: membership.shop, staff: nil, membership: membership,
      sessions_before: sessions_before, expires_at_before: expires_at_before
    )
  end

  def execute_shop_upgrade_and_log!(payment)
    shop = payment.shop
    base = shop.plan_expires_at && shop.plan_expires_at > Time.current ? shop.plan_expires_at : Time.current

    payment.update!(status: 'paid')
    shop.update!(plan: 'paid', plan_expires_at: base + payment.months.months)
    log_shop_upgrade!(shop, payment)
  end

  def log_shop_upgrade!(shop, payment)
    AuditLog.create!(
      shop: shop, staff: nil, action: 'shop_plan_upgraded', target_type: 'Shop', target_id: shop.id,
      details: { months: payment.months, amount: payment.amount, expires_at: shop.plan_expires_at }
    )
  end
end
# rubocop:enable Metrics/ClassLength
