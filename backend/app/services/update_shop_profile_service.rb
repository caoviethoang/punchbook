# frozen_string_literal: true

class UpdateShopProfileService
  Result = Struct.new(:success?, :shop, :errors, keyword_init: true)

  def initialize(shop, params)
    @shop = shop
    @params = params.to_h.symbolize_keys
  end

  def call
    permitted_params = @params.slice(
      :name, :phone, :address, :bank_name, :bank_account_no, :bank_account_name,
      :email_notifications_enabled, :sms_notifications_enabled, :zalo_notifications_enabled
    )

    if @shop.update(permitted_params)
      Result.new(success?: true, shop: @shop)
    else
      Result.new(success?: false, shop: @shop, errors: @shop.errors.full_messages)
    end
  end
end
