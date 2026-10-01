# frozen_string_literal: true

# Service object for handling shop and staff authentication during login.
class AuthenticateShopService
  Result = Struct.new(:success?, :payload, :error, keyword_init: true)

  def self.call(input:, password:, shop_context: nil)
    new(input: input, password: password, shop_context: shop_context).call
  end

  def initialize(input:, password:, shop_context: nil)
    @input = input.to_s.strip
    @password = password
    @shop_context = shop_context.to_s.strip.presence
  end

  def call
    payload = authenticate_owner || authenticate_scoped_staff || authenticate_unique_staff
    if payload
      Result.new(success?: true, payload: payload)
    else
      Result.new(success?: false, error: 'Invalid username/email, shop context, or password')
    end
  end

  private

  attr_reader :input, :password, :shop_context

  def authenticate_owner
    shop = Shop.find_for_database_authentication(email: input)
    return unless shop&.valid_password?(password)

    staff = shop.staffs.find_by(role: 'admin') || shop.staffs.create!(
      name: shop.name || 'Admin', username: shop.email, password: password, role: 'admin'
    )
    auth_payload(shop, staff)
  end

  def authenticate_scoped_staff
    if shop_context.present?
      authenticate_by_shop_context
    elsif input.include?('@')
      authenticate_by_email_prefix
    end
  end

  def authenticate_by_shop_context
    target_shop = Shop.find_by(email: shop_context)
    staff = target_shop&.staffs&.find_by(username: input)
    auth_payload(target_shop, staff) if staff&.authenticate(password)
  end

  def authenticate_by_email_prefix
    parts = input.split('@')
    target_shop = Shop.find_by(email: parts[1..].join('@'))
    staff = target_shop&.staffs&.find_by(username: parts[0])
    auth_payload(target_shop, staff) if staff&.authenticate(password)
  end

  def authenticate_unique_staff
    staffs = Staff.where(username: input)
    return unless staffs.one? && staffs.first.authenticate(password)

    staff = staffs.first
    auth_payload(staff.shop, staff)
  end

  def auth_payload(shop, staff)
    {
      token: JsonWebToken.encode({ shop_id: shop.id, staff_id: staff.id, role: staff.role }),
      shop: ShopSerializer.new(shop).as_json,
      staff: StaffSerializer.new(staff).as_json
    }
  end
end
