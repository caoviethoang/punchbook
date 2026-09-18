# frozen_string_literal: true

class ShopSerializer
  FIELDS = %i[id name phone address email plan plan_expires_at].freeze

  def initialize(shop)
    @shop = shop
  end

  def as_json(_options = nil)
    shop.as_json(only: FIELDS)
  end

  private

  attr_reader :shop
end
