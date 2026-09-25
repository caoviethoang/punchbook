# frozen_string_literal: true

module AuthHelpers
  def token_for(shop, role: 'owner', staff: nil)
    payload = { shop_id: shop.id, role: role }
    payload[:staff_id] = staff.id if staff.present?
    JsonWebToken.encode(payload)
  end

  def auth_headers(shop, role: 'owner', staff: nil)
    { 'Authorization' => "Bearer #{token_for(shop, role: role, staff: staff)}" }
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
