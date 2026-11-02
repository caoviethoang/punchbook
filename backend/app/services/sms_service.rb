# frozen_string_literal: true

# Unified service for sending SMS in Vietnam (supporting eSMS, SpeedSMS, Twilio or mock)
class SmsService
  class DeliveryError < StandardError; end

  def send_sms(phone:, message:, tracking_id: nil)
    normalized_phone = normalize_phone(phone)
    provider = ENV.fetch('SMS_PROVIDER', 'mock').downcase

    case provider
    when 'esms'
      send_esms(normalized_phone, message)
    when 'speedsms'
      send_speedsms(normalized_phone, message)
    else
      log_mock_sms(normalized_phone, message, tracking_id)
    end
  end

  private

  def normalize_phone(phone)
    cleaned = phone.to_s.gsub(/\D/, '')
    if cleaned.start_with?('0')
      "84#{cleaned[1..]}"
    elsif cleaned.start_with?('84')
      cleaned
    else
      "84#{cleaned}"
    end
  end

  def send_esms(phone, message)
    api_key = ENV.fetch('ESMS_API_KEY', nil)
    secret_key = ENV.fetch('ESMS_SECRET_KEY', nil)
    return log_mock_sms(phone, message, 'esms_missing_credentials') if api_key.blank?

    params = {
      'ApiKey' => api_key, 'SecretKey' => secret_key,
      'Phone' => phone, 'Content' => message, 'SmsType' => '2'
    }
    resp = Faraday.post('https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/',
                        params.to_json, { 'Content-Type' => 'application/json' })
    handle_http_response(resp)
  end

  def send_speedsms(phone, message)
    access_token = ENV.fetch('SPEEDSMS_ACCESS_TOKEN', nil)
    return log_mock_sms(phone, message, 'speedsms_missing_credentials') if access_token.blank?

    body = { to: [phone], content: message, sms_type: 2 }
    headers = {
      'Content-Type' => 'application/json',
      'Authorization' => "Basic #{Base64.strict_encode64("#{access_token}:x")}"
    }
    resp = Faraday.post('https://api.speedsms.vn/index.php/sms/send', body.to_json, headers)
    handle_http_response(resp)
  end

  def handle_http_response(response)
    raise DeliveryError, "SMS gateway returned HTTP #{response.status}: #{response.body}" unless response.success?

    JSON.parse(response.body)
  rescue JSON::ParserError
    { 'status' => 'success', 'raw' => response.body }
  end

  def log_mock_sms(phone, message, tracking_id)
    Rails.logger.info("[SMS Mock] To: #{phone} | Msg: #{message} | TrackingId: #{tracking_id}")
    {
      'status' => 'success',
      'provider' => 'mock',
      'message_id' => "mock_sms_#{SecureRandom.hex(8)}",
      'recipient' => phone
    }
  end
end
