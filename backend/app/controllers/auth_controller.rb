# frozen_string_literal: true

# API auth for Shop owners.
# Devise handles password hashing / validation; JWT (existing gem) is the API session.
class AuthController < ApplicationController
  wrap_parameters format: []
  before_action :authenticate_shop!, only: :me

  def register
    result = RegisterShopService.call(register_params)

    if result.success?
      admin_staff = result.shop.staffs.find_by(role: 'admin')
      render json: {
        token: result.token,
        shop: ShopSerializer.new(result.shop).as_json,
        staff: StaffSerializer.new(admin_staff).as_json
      }, status: :created
    else
      render json: { errors: result.errors }, status: :unprocessable_content
    end
  end

  def login
    login_input = (params[:email] || params[:username]).to_s.strip
    password = params[:password]
    shop_context = params[:shop_email].to_s.strip.presence

    # 1. Check if login_input is a Shop Owner Email directly
    shop = Shop.find_for_database_authentication(email: login_input)
    if shop&.valid_password?(password)
      staff = shop.staffs.find_by(role: 'admin') || shop.staffs.create!(
        name: shop.name || 'Admin',
        username: shop.email,
        password: password,
        role: 'admin'
      )
      return render json: auth_payload(shop, staff)
    end

    # 2. Check if username contains shop email in 'username@shop_email' format (e.g. 'letan_a@studio1@punchbook.test')
    if login_input.include?('@') && shop_context.blank?
      parts = login_input.split('@')
      if parts.size >= 2
        possible_username = parts[0]
        possible_shop_email = parts[1..].join('@')
        target_shop = Shop.find_by(email: possible_shop_email)
        if target_shop
          staff = target_shop.staffs.find_by(username: possible_username)
          return render json: auth_payload(target_shop, staff) if staff&.authenticate(password)
        end
      end
    end

    # 3. Check if explicit shop_email context was provided
    if shop_context.present?
      target_shop = Shop.find_by(email: shop_context)
      if target_shop
        staff = target_shop.staffs.find_by(username: login_input)
        return render json: auth_payload(target_shop, staff) if staff&.authenticate(password)
      end
    end

    # 4. Fallback: Check if username is unique across all staffs
    staffs = Staff.where(username: login_input)
    if staffs.count == 1 && staffs.first.authenticate(password)
      staff = staffs.first
      return render json: auth_payload(staff.shop, staff)
    end

    render json: { error: 'Invalid username/email, shop context, or password' }, status: :unauthorized
  end

  def me
    render json: {
      shop: ShopSerializer.new(current_shop).as_json,
      staff: StaffSerializer.new(current_staff).as_json
    }
  end

  private

  def register_params
    # Do not permit :plan — new shops always start on the free default.
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
