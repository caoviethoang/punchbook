# frozen_string_literal: true

# API auth for Shop owners.
# Devise handles password hashing / validation; JWT (existing gem) is the API session.
class AuthController < ApplicationController
  wrap_parameters format: []
  before_action :authenticate_shop!, only: :me

  def register
    result = RegisterShopService.call(register_params)
    if result.success?
      render_register_success(result)
    else
      render_register_failure(result)
    end
  end

  def login
    result = AuthenticateShopService.call(
      input: params[:email] || params[:username],
      password: params[:password],
      shop_context: params[:shop_email]
    )

    render_login_result(result)
  end

  def me
    render json: {
      shop: ShopSerializer.new(current_shop).as_json,
      staff: StaffSerializer.new(current_staff).as_json
    }
  end

  private

  def render_register_success(result)
    admin_staff = result.shop.staffs.find_by(role: 'admin')
    render json: {
      token: result.token,
      shop: ShopSerializer.new(result.shop).as_json,
      staff: StaffSerializer.new(admin_staff).as_json
    }, status: :created
  end

  def render_register_failure(result)
    render json: {
      error: result.errors.join(', '),
      code: 'VALIDATION_ERROR',
      details: { errors: result.errors },
      errors: result.errors
    }, status: :unprocessable_content
  end

  def register_params
    params.permit(:name, :phone, :email, :password, :password_confirmation)
  end

  def render_login_result(result)
    if result.success?
      reset_login_rate_limit if defined?(Rack::Attack) && Rack::Attack.enabled
      render json: result.payload
    else
      render json: { error: result.error, code: 'INVALID_CREDENTIALS' }, status: :unauthorized
    end
  end

  def reset_login_rate_limit
    Rack::Attack::Allow2Ban.reset(request.ip, findtime: 5.minutes)
  end
end
