# frozen_string_literal: true

# Encapsulates dashboard-level aggregation queries for a given shop.
# Keeps DashboardController free of raw SQL / AR query logic.
class DashboardQuery
  def initialize(shop)
    @shop = shop
  end

  # Returns total paid invoice amount for the current calendar month, scoped to the shop.
  def revenue_this_month
    Invoice
      .joins(:membership)
      .where(memberships: { shop_id: shop.id })
      .where(status: 'paid')
      .where(created_at: Time.zone.now.all_month)
      .sum(:amount)
  end

  private

  attr_reader :shop
end
