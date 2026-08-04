# frozen_string_literal: true

# JWT Bearer auth for shop-scoped API requests.
# Inherit ApiController to run authenticate_shop! automatically.
module Authenticatable
  extend ActiveSupport::Concern

  included do
    attr_reader :current_shop
  end

  private

  def authenticate_shop!
    @current_shop = shop_from_token
    render json: { error: 'Unauthorized' }, status: :unauthorized unless @current_shop
  end

  def shop_from_token
    token = bearer_token
    return if token.blank?

    payload = JsonWebToken.decode(token)
    Shop.find_by(id: payload&.dig(:shop_id))
  end

  def bearer_token
    pattern = /\ABearer\s+(.+)\z/i
    header = request.headers['Authorization'].to_s
    header[pattern, 1]
  end
end
