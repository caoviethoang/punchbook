# frozen_string_literal: true

require 'openssl'
require 'faraday'

class PayosService
  class Error < StandardError; end
  class ApiError < Error; end

  BASE_URL = 'https://api-merchant.payos.vn'

  Result = Data.define(:payment_link_id, :checkout_url, :qr_code)

  def self.create_payment_link(...)
    new.create_payment_link(...)
  end

  def self.verify_webhook_signature?(payload_data, received_signature)
    new.verify_webhook_signature?(payload_data, received_signature)
  end

  def verify_webhook_signature?(payload_data, received_signature)
    return false if received_signature.blank? || payload_data.nil?

    hash_data = extract_hash_data(payload_data)
    return false unless hash_data.is_a?(Hash)

    data_string = build_signature_data_string(hash_data)
    computed = OpenSSL::HMAC.hexdigest('sha256', ENV.fetch('PAYOS_CHECKSUM_KEY', ''), data_string)
    ActiveSupport::SecurityUtils.secure_compare(computed, received_signature.to_s)
  end

  def create_payment_link(order_code:, amount:, description:, cancel_url:, return_url:)
    payload = build_payload(order_code, amount, description, cancel_url, return_url)
    response = connection.post('/v2/payment-requests', payload.to_json)
    handle_response(response)
  rescue Faraday::Error => e
    raise ApiError, "payOS API request failed: #{e.message}"
  end

  private

  def extract_hash_data(payload_data)
    payload_data.respond_to?(:to_unsafe_h) ? payload_data.to_unsafe_h : payload_data.to_h
  end

  def build_signature_data_string(hash_data)
    hash_data.keys.map(&:to_s).sort.map do |key|
      val = hash_data[key] || hash_data[key.to_sym]
      "#{key}=#{val}"
    end.join('&')
  end

  def build_payload(order_code, amount, description, cancel_url, return_url)
    payload = {
      orderCode: order_code.to_i,
      amount: amount.to_i,
      description: description.to_s,
      cancelUrl: cancel_url.to_s,
      returnUrl: return_url.to_s
    }
    payload.merge(signature: generate_signature(payload))
  end

  def generate_signature(payload)
    data_string = "amount=#{payload[:amount]}&cancelUrl=#{payload[:cancelUrl]}" \
                  "&description=#{payload[:description]}&orderCode=#{payload[:orderCode]}" \
                  "&returnUrl=#{payload[:returnUrl]}"
    OpenSSL::HMAC.hexdigest('sha256', ENV.fetch('PAYOS_CHECKSUM_KEY', ''), data_string)
  end

  def connection
    Faraday.new(url: BASE_URL) do |f|
      f.headers['x-client-id'] = ENV.fetch('PAYOS_CLIENT_ID', '')
      f.headers['x-api-key'] = ENV.fetch('PAYOS_API_KEY', '')
      f.headers['Content-Type'] = 'application/json'
    end
  end

  def handle_response(response)
    raise ApiError, "payOS HTTP Error #{response.status}: #{response.body}" unless response.success?

    body = parse_body(response.body)
    raise ApiError, "payOS Error [#{body['code']}]: #{body['desc']}" if body['code'] != '00'

    data = body['data'] || {}
    Result.new(payment_link_id: data['paymentLinkId'], checkout_url: data['checkoutUrl'], qr_code: data['qrCode'])
  end

  def parse_body(body_string)
    JSON.parse(body_string)
  rescue JSON::ParserError
    {}
  end
end
