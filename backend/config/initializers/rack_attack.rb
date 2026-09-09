# frozen_string_literal: true

# Rack::Attack rate limiting configuration
class Rack::Attack
  # Use MemoryStore for tracking rate limit hit counts across requests
  Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

  # 1. Throttle login attempts: max 5 requests per minute per IP
  throttle('req/ip/login', limit: 5, period: 1.minute) do |req|
    req.ip if req.path == '/auth/login' && req.post?
  end

  # 2. Throttle password update: max 5 requests per minute per IP
  throttle('req/ip/password_update', limit: 5, period: 1.minute) do |req|
    req.ip if req.path == '/settings/password' && req.patch?
  end

  # 3. Throttle check-in endpoint: max 10 requests per minute per IP
  throttle('req/ip/check_in', limit: 10, period: 1.minute) do |req|
    req.ip if req.post? && req.path.match?(%r{\A/memberships/\d+/check_in\z})
  end

  # Custom 429 Too Many Requests response format in JSON
  self.throttled_responder = lambda do |_req|
    headers = {
      'Content-Type' => 'application/json'
    }
    body = {
      error: 'Too Many Requests',
      message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'
    }.to_json

    [429, headers, [body]]
  end
end
