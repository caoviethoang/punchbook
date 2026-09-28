# frozen_string_literal: true

# API auth for Shop owners.
# Devise handles password hashing / validation; JWT (existing gem) is the API session.
class AuthController < ApplicationController
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
    login_input = params[:email] || params[:username]
    password = params[:password]

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

    staff = Staff.find_by(username: login_input)
    if staff&.authenticate(password)
      return render json: auth_payload(staff.shop, staff)
    end

    render json: { error: 'Invalid username/email or password' }, status: :unauthorized
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
