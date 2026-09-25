# frozen_string_literal: true

class UpdateShopProfileService
  Result = Struct.new(:success?, :shop, :errors, keyword_init: true)

  def initialize(shop, params)
    @shop = shop
    @params = params.to_h.symbolize_keys
  end

  def call
    permitted_params = @params.slice(:name, :phone, :address)

    if @shop.update(permitted_params)
      Result.new(success?: true, shop: @shop)
    else
      Result.new(success?: false, shop: @shop, errors: @shop.errors.full_messages)
    end
  end
end
