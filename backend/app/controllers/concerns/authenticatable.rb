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
    @current_staff ||= @current_shop&.staffs&.find_by(role: 'admin') ||
                       @current_shop&.staffs&.first ||
                       (@current_shop && @current_shop.staffs.create!(name: @current_shop.name || 'Admin', role: 'admin'))

    render json: { error: 'Unauthorized' }, status: :unauthorized unless @current_shop
  end

  def current_ability
    @current_ability ||= Ability.new(current_staff)
  end

  def require_admin!
    authorize! :manage, :all
  end

  def bearer_token
    pattern = /\ABearer\s+(.+)\z/i
    header = request.headers['Authorization'].to_s
    header[pattern, 1]
  end
end
