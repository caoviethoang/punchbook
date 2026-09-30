# frozen_string_literal: true

class UpgradeShopPlanService
  Result = Struct.new(:success?, :shop, :errors, keyword_init: true)

  def initialize(shop, months: 1)
    @shop = shop
    @months = months.to_i
  end

  def call
    return Result.new(success?: false, errors: ['Số tháng nâng cấp không hợp lệ']) if @months <= 0

    base_time = @shop.plan_expires_at && @shop.plan_expires_at > Time.current ? @shop.plan_expires_at : Time.current

    @shop.plan = 'paid'
    @shop.plan_expires_at = base_time + @months.months

    if @shop.save
      Result.new(success?: true, shop: @shop)
    else
      Result.new(success?: false, errors: @shop.errors.full_messages)
    end
  end
end
