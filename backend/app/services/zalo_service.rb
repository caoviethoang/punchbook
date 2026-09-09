# frozen_string_literal: true

require 'faraday'

# Service to interact with the Zalo ZBS Open API (Zalo Notification Service - ZNS).
# Manages access token and refresh token storage in Rails.cache, and refreshes them atomically.
class ZaloService
  class Error < StandardError; end

  def normalize_phone(phone)
    cleaned = phone.to_s.gsub(/\D/, '')
    cleaned.sub(/\A0/, '84')
  end

  def send_template_message(phone:, template_id:, template_data:, tracking_id: nil)
    payload = build_payload(phone, template_id, template_data, tracking_id)
    response, body = execute_with_token_retry(payload)
    validate_response!(response, body)
    body
  end

  def access_token
    Rails.cache.read('zalo_access_token')
  end

  def refresh_token
    Rails.cache.fetch('zalo_refresh_token') { ENV.fetch('ZALO_REFRESH_TOKEN', nil) }
  end

  def refresh_access_token!
    current_refresh_token = refresh_token
    raise Error, 'No refresh token available to refresh Zalo access token' if current_refresh_token.blank?

    response = dispatch_token_refresh(current_refresh_token)
    body = parse_json(response.body)
    verify_token_response!(response, body)

    cache_tokens!(body)
    body['access_token']
  end

  private

  def build_payload(phone, template_id, template_data, tracking_id)
    payload = {
      phone: normalize_phone(phone),
      template_id: template_id,
      template_data: template_data
    }
    payload[:tracking_id] = tracking_id if tracking_id.present?
    payload
  end

  def execute_with_token_retry(payload)
    token = access_token || refresh_access_token!
    response = dispatch_message(token, payload)
    body = parse_json(response.body)

    if unauthenticated?(response, body)
      token = refresh_access_token!
      response = dispatch_message(token, payload)
      body = parse_json(response.body)
    end

    [response, body]
  end

  def unauthenticated?(response, body)
    response.status == 401 || (body.is_a?(Hash) && body['error'] == -117)
  end

  def validate_response!(response, body)
    raise Error, "Zalo API HTTP Error #{response.status}: #{response.body}" unless response.success?
    raise Error, "Zalo ZBS Error [#{body['error']}]: #{body['message']}" if body['error'].to_i != 0
  end

  def verify_token_response!(response, body)
    unless response.success?
      raise Error, "Failed to refresh Zalo access token. HTTP #{response.status}: #{response.body}"
    end

    return if body['access_token'].present? && body['refresh_token'].present?

    raise Error, "Failed to refresh Zalo access token: #{body['error_description'] || body['error'] || response.body}"
  end

  def dispatch_token_refresh(refresh_token)
    form_params = {
      refresh_token: refresh_token,
      app_id: ENV.fetch('ZALO_APP_ID', ''),
      grant_type: 'refresh_token'
    }
    headers = {
      'Content-Type' => 'application/x-www-form-urlencoded',
      'secret_key' => ENV.fetch('ZALO_APP_SECRET', '')
    }

    Faraday.post('https://oauth.zaloapp.com/v4/oa/access_token', URI.encode_www_form(form_params), headers)
  end

  def cache_tokens!(body)
    expires_in = (body['expires_in'] || 90_000).to_i.seconds
    Rails.cache.write('zalo_access_token', body['access_token'], expires_in: expires_in - 5.minutes)
    Rails.cache.write('zalo_refresh_token', body['refresh_token'])
  end

  def dispatch_message(token, payload)
    headers = { 'Content-Type' => 'application/json', 'access_token' => token }
    Faraday.post('https://business.openapi.zalo.me/message/template', payload.to_json, headers)
  end

  def parse_json(body_string)
    JSON.parse(body_string)
  rescue JSON::ParserError, TypeError
    {}
  end
end
