# frozen_string_literal: true

class RegisterShopService
  Result = Struct.new(:success?, :shop, :token, :errors, keyword_init: true)

  def self.call(params)
    new(params).call
  end

  def initialize(params)
    @params = params
  end

  def call
    shop = Shop.new(params)

    if shop.save
      token = JsonWebToken.encode({ shop_id: shop.id })
      Result.new(success?: true, shop: shop, token: token)
    else
      Result.new(success?: false, errors: shop.errors.full_messages)
    end
  end

  private

  attr_reader :params
end
