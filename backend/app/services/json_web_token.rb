# frozen_string_literal: true

module JsonWebToken
  class << self
    def encode(payload, exp: 24.hours.from_now)
      JWT.encode(payload.merge(exp: exp.to_i), secret, 'HS256')
    end

    def decode(token)
      body, = JWT.decode(token, secret, true, algorithm: 'HS256')
      body.with_indifferent_access
    rescue JWT::DecodeError
      nil
    end

    private

    def secret
      ENV.fetch('JWT_SECRET')
    rescue KeyError
      raise KeyError, 'JWT_SECRET env var is required' unless Rails.env.local?

      Rails.application.secret_key_base
    end
  end
end
