# frozen_string_literal: true

module AuthHelpers
  def token_for(shop, staff = nil)
    staff ||= shop.staffs.find_by(role: 'admin') || shop.staffs.create!(name: shop.name || 'Admin', role: 'admin')
    JsonWebToken.encode({ shop_id: shop.id, staff_id: staff.id, role: staff.role })
  end

  def auth_headers(shop, staff = nil)
    { 'Authorization' => "Bearer #{token_for(shop, staff)}" }
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
