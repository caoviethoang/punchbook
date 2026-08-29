# frozen_string_literal: true

require 'faraday'

# Service to interact with the Zalo ZBS Open API (Zalo Notification Service - ZNS).
# Manages access token and refresh token storage in Rails.cache, and refreshes them atomically.
# rubocop:disable Metrics/MethodLength, Metrics/AbcSize, Metrics/CyclomaticComplexity
class ZaloService
  class Error < StandardError; end

  def normalize_phone(phone)
    cleaned = phone.to_s.gsub(/\D/, '')
    cleaned.sub(/\A0/, '84')
  end

  def send_template_message(phone:, template_id:, template_data:, tracking_id: nil)
    normalized_phone = normalize_phone(phone)
    token = access_token || refresh_access_token!

    payload = {
      phone: normalized_phone,
      template_id: template_id,
      template_data: template_data
    }
    payload[:tracking_id] = tracking_id if tracking_id.present?

    response = dispatch_message(token, payload)
    body = parse_json(response.body)

    # Check for authentication errors (HTTP 401 or specific Zalo error code)
    if response.status == 401 || (body.is_a?(Hash) && body['error'] == -117)
      token = refresh_access_token!
      response = dispatch_message(token, payload)
      body = parse_json(response.body)
    end

    raise Error, "Zalo API HTTP Error #{response.status}: #{response.body}" unless response.success?

    raise Error, "Zalo ZBS Error [#{body['error']}]: #{body['message']}" if body['error'].to_i != 0

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

    response = Faraday.post(
      'https://oauth.zaloapp.com/v4/oa/access_token',
      URI.encode_www_form({
                            refresh_token: current_refresh_token,
                            app_id: ENV.fetch('ZALO_APP_ID', ''),
                            grant_type: 'refresh_token'
                          }),
      {
        'Content-Type' => 'application/x-www-form-urlencoded',
        'secret_key' => ENV.fetch('ZALO_APP_SECRET', '')
      }
    )

    unless response.success?
      raise Error, "Failed to refresh Zalo access token. HTTP #{response.status}: #{response.body}"
    end

    body = parse_json(response.body)
    unless body['access_token'].present? && body['refresh_token'].present?
      raise Error, "Failed to refresh Zalo access token: #{body['error_description'] || body['error'] || response.body}"
    end

    expires_in = (body['expires_in'] || 90_000).to_i.seconds
    # Cache access token slightly shorter than expiry to avoid race conditions
    Rails.cache.write('zalo_access_token', body['access_token'], expires_in: expires_in - 5.minutes)
    Rails.cache.write('zalo_refresh_token', body['refresh_token'])
    body['access_token']
  end

  private

  def dispatch_message(token, payload)
    Faraday.post(
      'https://business.openapi.zalo.me/message/template',
      payload.to_json,
      {
        'Content-Type' => 'application/json',
        'access_token' => token
      }
    )
  end

  def parse_json(body_string)
    JSON.parse(body_string)
  rescue JSON::ParserError, TypeError
    {}
  end
end
# rubocop:enable Metrics/MethodLength, Metrics/AbcSize, Metrics/CyclomaticComplexity
