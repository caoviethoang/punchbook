# frozen_string_literal: true

module AuthHelpers
  def token_for(shop)
    JsonWebToken.encode({ shop_id: shop.id })
  end

  def auth_headers(shop)
    { 'Authorization' => "Bearer #{token_for(shop)}" }
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
