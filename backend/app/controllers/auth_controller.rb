# frozen_string_literal: true

# API auth for Shop owners.
# Devise handles password hashing / validation; JWT (existing gem) is the API session.
class AuthController < ApplicationController
  before_action :authenticate_shop!, only: :me

  def register
    result = RegisterShopService.call(register_params)

    if result.success?
      render json: { token: result.token, shop: ShopSerializer.new(result.shop).as_json }, status: :created
    else
      render json: { errors: result.errors }, status: :unprocessable_content
    end
  end

  def login
    shop = Shop.find_for_database_authentication(email: params[:email])

    if shop&.valid_password?(params[:password])
      render json: auth_payload(shop)
    else
      render json: { error: 'Invalid email or password' }, status: :unauthorized
    end
  end

  def me
    render json: { shop: ShopSerializer.new(current_shop).as_json }
  end

  private

  def register_params
    # Do not permit :plan — new shops always start on the free default.
    params.permit(:name, :phone, :email, :password, :password_confirmation)
  end

  def auth_payload(shop)
    {
      token: JsonWebToken.encode({ shop_id: shop.id }),
      shop: ShopSerializer.new(shop).as_json
    }
  end
end
