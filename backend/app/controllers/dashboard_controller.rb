# frozen_string_literal: true

class DashboardController < ApiController
  def show
    memberships = current_shop.memberships.includes(:package).order(:customer_name)
    query = DashboardQuery.new(current_shop)

    render json: {
      revenue_this_month: query.revenue_this_month,
      active_memberships_count: memberships.count { |m| m.status != 'expired' },
      expiring_within_7_days_count: memberships.count { |m| m.status == 'expiring' },
      memberships: memberships.map(&:as_dashboard_json)
    }
  end
end
