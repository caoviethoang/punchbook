# frozen_string_literal: true

# API auth for Shop owners.
# Devise handles password hashing / validation; JWT (existing gem) is the API session.
class AuthController < ApplicationController
  wrap_parameters format: []
  before_action :authenticate_shop!, only: :me

  def register
    result = RegisterShopService.call(register_params)
    return render json: { errors: result.errors }, status: :unprocessable_content unless result.success?

    admin_staff = result.shop.staffs.find_by(role: 'admin')
    render json: {
      token: result.token,
      shop: ShopSerializer.new(result.shop).as_json,
      staff: StaffSerializer.new(admin_staff).as_json
    }, status: :created
  end

  def login
    input, password, shop_context = extract_login_params
    payload = authenticate_owner(input, password) ||
              authenticate_scoped_staff(input, password, shop_context) ||
              authenticate_unique_staff(input, password)

    return render json: payload if payload

    render json: { error: 'Invalid username/email, shop context, or password' }, status: :unauthorized
  end

  def me
    render json: {
      shop: ShopSerializer.new(current_shop).as_json,
      staff: StaffSerializer.new(current_staff).as_json
    }
  end

  private

  def extract_login_params
    [
      (params[:email] || params[:username]).to_s.strip,
      params[:password],
      params[:shop_email].to_s.strip.presence
    ]
  end

  def authenticate_owner(email, password)
    shop = Shop.find_for_database_authentication(email: email)
    return unless shop&.valid_password?(password)

    staff = shop.staffs.find_by(role: 'admin') || shop.staffs.create!(
      name: shop.name || 'Admin', username: shop.email, password: password, role: 'admin'
    )
    auth_payload(shop, staff)
  end

  def authenticate_scoped_staff(input, password, shop_context)
    if shop_context.present?
      authenticate_by_shop_context(input, password, shop_context)
    elsif input.include?('@')
      authenticate_by_email_prefix(input, password)
    end
  end

  def authenticate_by_shop_context(input, password, shop_context)
    target_shop = Shop.find_by(email: shop_context)
    staff = target_shop&.staffs&.find_by(username: input)
    auth_payload(target_shop, staff) if staff&.authenticate(password)
  end

  def authenticate_by_email_prefix(input, password)
    parts = input.split('@')
    target_shop = Shop.find_by(email: parts[1..].join('@'))
    staff = target_shop&.staffs&.find_by(username: parts[0])
    auth_payload(target_shop, staff) if staff&.authenticate(password)
  end

  def authenticate_unique_staff(input, password)
    staffs = Staff.where(username: input)
    return unless staffs.one? && staffs.first.authenticate(password)

    staff = staffs.first
    auth_payload(staff.shop, staff)
  end

  def register_params
    params.permit(:name, :phone, :email, :password, :password_confirmation)
  end

  def auth_payload(shop, staff)
    {
      token: JsonWebToken.encode({ shop_id: shop.id, staff_id: staff.id, role: staff.role }),
      shop: ShopSerializer.new(shop).as_json,
      staff: StaffSerializer.new(staff).as_json
    }
  end
end
