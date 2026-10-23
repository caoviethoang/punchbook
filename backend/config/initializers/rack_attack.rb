# frozen_string_literal: true

# Rack::Attack rate limiting configuration
class Rack::Attack
  # Use MemoryStore for tracking rate limit hit counts across requests
  Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

  # 1. Brute-force protection: max 10 failed login attempts per IP within 5 minutes
  blocklist('logins/ip') do |req|
    Rack::Attack::Allow2Ban.filter(req.ip, maxretry: 10, findtime: 5.minutes, bantime: 5.minutes) do
      ['/auth/login', '/api/v1/auth/login'].include?(req.path) && req.post?
    end
  end

  # 2. Throttle password update: max 5 requests per minute per IP
  throttle('req/ip/password_update', limit: 5, period: 1.minute) do |req|
    req.ip if ['/settings/password', '/api/v1/settings/password'].include?(req.path) && req.patch?
  end

  # 3. Throttle check-in endpoint: max 10 requests per minute per IP
  throttle('req/ip/check_in', limit: 10, period: 1.minute) do |req|
    req.ip if req.post? && req.path.match?(%r{\A(/api/v1)?/memberships/[^/]+/check_in\z})
  end

  # Custom 429 Too Many Requests response format in JSON
  error_429_responder = lambda do |_req|
    headers = {
      'Content-Type' => 'application/json'
    }
    body = {
      error: 'Too Many Requests',
      code: 'TOO_MANY_REQUESTS',
      details: { message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
      message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'
    }.to_json

    [429, headers, [body]]
  end

  self.throttled_responder = error_429_responder
  self.blocklisted_responder = error_429_responder
end

# Subscribe to Rack::Attack notifications to log blocked and throttled IPs
ActiveSupport::Notifications.subscribe(/rack_attack/) do |_name, _start, _finish, _request_id, payload|
  req = payload[:request]
  match_type = req.env['rack.attack.match_type']
  rule = req.env['rack.attack.matched']
  Rails.logger.warn("[Rack::Attack][#{match_type}] Blocked IP: #{req.ip} | Rule: #{rule} | Path: #{req.path}")
end
