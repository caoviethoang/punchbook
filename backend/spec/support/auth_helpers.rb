# frozen_string_literal: true

module AuthHelpers
  def token_for(shop, staff_or_options = nil, role: nil, staff: nil)
    role, staff = extract_auth_options(staff_or_options, role, staff)
    staff ||= resolve_auth_staff(shop, role)

    JsonWebToken.encode({ shop_id: shop.id, staff_id: staff.id, role: staff.role })
  end

  def auth_headers(shop, staff_or_options = nil, role: nil, staff: nil)
    { 'Authorization' => "Bearer #{token_for(shop, staff_or_options, role: role, staff: staff)}" }
  end

  private

  def extract_auth_options(staff_or_options, role, staff)
    if staff_or_options.is_a?(Hash)
      [staff_or_options[:role] || role, staff_or_options[:staff] || staff]
    elsif staff_or_options.is_a?(Staff)
      [role, staff_or_options]
    else
      [role, staff]
    end
  end

  def resolve_auth_staff(shop, role)
    if role == 'staff'
      shop.staffs.find_by(role: 'staff') || shop.staffs.create!(name: 'Staff', role: 'staff')
    else
      shop.staffs.find_by(role: 'admin') || shop.staffs.create!(name: shop.name || 'Admin', role: 'admin')
    end
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
