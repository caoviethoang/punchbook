# frozen_string_literal: true

module Authenticatable
  extend ActiveSupport::Concern

  included do
    attr_reader :current_shop
  end

  private

  def authenticate_shop!
    @current_shop = shop_from_token
    return if @current_shop

    render json: { error: 'Unauthorized' }, status: :unauthorized
  end

  def shop_from_token
    token = bearer_token
    return if token.blank?

    payload = JsonWebToken.decode(token)
    return if payload.blank? || payload[:shop_id].blank?

    Shop.find_by(id: payload[:shop_id])
  end

  def bearer_token
    header = request.headers['Authorization'].to_s
    scheme, token = header.split(' ', 2)
    return if scheme.blank? || token.blank?
    return unless scheme.match?(/\ABearer\z/i)

    token
  end
end
