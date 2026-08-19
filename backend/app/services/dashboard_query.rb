# frozen_string_literal: true

# Shop-scoped dashboard payload: revenue, counts, and membership rows.
class DashboardQuery
  def self.call(shop)
    new(shop).to_h
  end

  def initialize(shop)
    @shop = shop
  end

  def to_h
    memberships = shop.memberships.includes(:package).order(:customer_name)

    {
      revenue_this_month: revenue_this_month,
      active_memberships_count: memberships.count { |m| m.status != 'expired' },
      expiring_within_7_days_count: memberships.count { |m| m.status == 'expiring' },
      memberships: memberships.map(&:as_dashboard_json)
    }
  end

  private

  attr_reader :shop

  def revenue_this_month
    Invoice
      .joins(:membership)
      .where(memberships: { shop_id: shop.id })
      .where(status: 'paid')
      .where(created_at: Time.zone.now.all_month)
      .sum(:amount)
  end
end
