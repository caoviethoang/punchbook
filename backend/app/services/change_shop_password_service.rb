# frozen_string_literal: true

class ChangeShopPasswordService
  Result = Struct.new(:success, :shop, :errors, keyword_init: true) do
    def success?
      success == true
    end
  end

  def initialize(shop, params)
    @shop = shop
    @params = params.to_h.symbolize_keys
  end

  def call
    error = validate_current_password
    return Result.new(success: false, shop: @shop, errors: [error]) if error

    update_password
  end

  private

  def validate_current_password
    current_password = @params[:current_password]
    return 'Mật khẩu hiện tại không được để trống' if current_password.blank?
    return 'Mật khẩu hiện tại không đúng' unless @shop.valid_password?(current_password)

    nil
  end

  def update_password
    if @shop.update(password: @params[:password], password_confirmation: @params[:password_confirmation])
      Result.new(success: true, shop: @shop)
    else
      Result.new(success: false, shop: @shop, errors: @shop.errors.full_messages)
    end
  end
end
