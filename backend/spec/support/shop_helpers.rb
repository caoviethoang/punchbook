# frozen_string_literal: true

module ShopHelpers
  def create_shop(**attrs)
    defaults = {
      name: 'Lan Spa',
      phone: '0901000000',
      email: "shop-#{SecureRandom.hex(4)}@example.com",
      password: 'password123',
      password_confirmation: 'password123'
    }

    Shop.create!(defaults.merge(attrs))
  end
end

RSpec.configure do |config|
  config.include ShopHelpers
end
