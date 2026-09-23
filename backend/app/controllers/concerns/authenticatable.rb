# frozen_string_literal: true

# JWT Bearer auth for shop-scoped API requests.
# Inherit ApiController to run authenticate_shop! automatically.
module Authenticatable
  extend ActiveSupport::Concern

  included do
    attr_reader :current_shop, :current_token_payload
  end

  private

  def authenticate_shop!
    @current_token_payload = decoded_token_payload
    @current_shop = shop_from_token
    render json: { error: 'Unauthorized' }, status: :unauthorized unless @current_shop
  end

  def current_role
    @current_token_payload&.dig(:role)&.to_s || 'owner'
  end

  def owner?
    current_role == 'owner'
  end

  def staff?
    current_role == 'staff'
  end

  def current_staff
    return unless staff?
    return @current_staff if defined?(@current_staff)

    staff_id = @current_token_payload&.dig(:staff_id)
    @current_staff = current_shop.staffs.find_by(id: staff_id)
  end

  def require_owner!
    return if owner?

    render json: { error: 'Forbidden: Thao tác này chỉ dành cho Chủ tiệm' }, status: :forbidden
  end

  def decoded_token_payload
    token = bearer_token
    return if token.blank?

    JsonWebToken.decode(token)
  end

  def shop_from_token
    return if @current_token_payload.blank?

    Shop.find_by(id: @current_token_payload[:shop_id])
  end

  def bearer_token
    pattern = /\ABearer\s+(.+)\z/i
    header = request.headers['Authorization'].to_s
    header[pattern, 1]
  end
end
