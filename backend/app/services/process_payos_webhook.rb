# frozen_string_literal: true

# Service object for handling payOS webhook payloads.
# Verifies HMAC signature before making any database updates.
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
    return [false, :invoice_not_found] if invoice.nil?
    return [true, :already_processed] if invoice.status == 'paid'

    process_payment(invoice)
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
    Invoice.find_by(id: order_code)
  end

  def process_payment(invoice)
    if response_code == '00'
      Invoice.transaction do
        invoice.update!(status: 'paid')
        invoice.membership.renew!
      end
      [true, :success]
    else
      [true, :payment_not_successful]
    end
  end
end
