# frozen_string_literal: true

# JWT Bearer auth for shop-scoped API requests.
# Inherit ApiController to run authenticate_shop! automatically.
module Authenticatable
  extend ActiveSupport::Concern

  included do
    attr_reader :current_shop, :current_staff
  end

  private

  def authenticate_shop!
    token = bearer_token
    payload = JsonWebToken.decode(token) if token.present?

    @current_shop = Shop.find_by(id: payload&.dig(:shop_id)) if payload
    if @current_shop && payload&.dig(:staff_id)
      @current_staff = @current_shop.staffs.find_by(id: payload[:staff_id])
    end
    @current_staff ||= @current_shop&.staffs&.find_by(role: 'admin') || @current_shop&.staffs&.first

    render json: { error: 'Unauthorized' }, status: :unauthorized unless @current_shop
  end

  def require_admin!
    return if current_staff&.admin?

    render json: { error: 'Access denied. Admin permissions required.' }, status: :forbidden
  end

  def bearer_token
    pattern = /\ABearer\s+(.+)\z/i
    header = request.headers['Authorization'].to_s
    header[pattern, 1]
  end
end
