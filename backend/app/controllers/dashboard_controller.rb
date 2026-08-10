# frozen_string_literal: true

class DashboardController < ApiController
  def show
    memberships = current_shop.memberships.includes(:package).order(:customer_name)

    render json: {
      revenue_this_month: revenue_this_month,
      active_memberships_count: memberships.count { |m| m.status != 'expired' },
      expiring_within_7_days_count: memberships.count { |m| m.status == 'expiring' },
      memberships: memberships.map(&:as_dashboard_json)
    }
  end

  private

  def revenue_this_month
    Invoice
      .joins(:membership)
      .where(memberships: { shop_id: current_shop.id })
      .where(status: 'paid')
      .where(created_at: Time.zone.now.all_month)
      .sum(:amount)
  end
end
