# frozen_string_literal: true

# API auth for Shop owners.
# Devise handles password hashing / validation; JWT (existing gem) is the API session.
class AuthController < ApplicationController
  before_action :authenticate_shop!, only: :me

  def register
    shop = Shop.new(register_params)

    if shop.save
      render json: auth_payload(shop), status: :created
    else
      render json: { errors: shop.errors.full_messages }, status: :unprocessable_content
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
    render json: { shop: shop_json(current_shop) }
  end

  private

  def register_params
    # Do not permit :plan — new shops always start on the free default.
    params.permit(:name, :phone, :email, :password, :password_confirmation)
  end

  def auth_payload(shop)
    {
      token: JsonWebToken.encode({ shop_id: shop.id }),
      shop: shop_json(shop)
    }
  end

  def shop_json(shop)
    shop.as_json(only: %i[id name phone email plan])
  end
end
