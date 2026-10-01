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
    result = AuthenticateShopService.call(
      input: params[:email] || params[:username],
      password: params[:password],
      shop_context: params[:shop_email]
    )

    if result.success?
      render json: result.payload
    else
      render json: { error: result.error }, status: :unauthorized
    end
  end

  def me
    render json: {
      shop: ShopSerializer.new(current_shop).as_json,
      staff: StaffSerializer.new(current_staff).as_json
    }
  end

  private

  def register_params
    params.permit(:name, :phone, :email, :password, :password_confirmation)
  end
end
