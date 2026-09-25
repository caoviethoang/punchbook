# frozen_string_literal: true

# Shop-scoped dashboard payload: revenue, counts, analytics, and membership rows.
class DashboardQuery
  def self.call(shop)
    new(shop).to_h
  end

  def initialize(shop)
    @shop = shop
  end

  def to_h
    memberships = shop.memberships.includes(:package).order(:customer_name)
    hourly = check_in_frequency_by_hour

    {
      revenue_this_month: revenue_this_month, active_memberships_count: active_count(memberships),
      expiring_within_7_days_count: expiring_count(memberships), daily_revenue_30_days: daily_revenue_30_days,
      check_in_frequency_by_hour: hourly, peak_check_in_hour: calculate_peak_hour(hourly),
      memberships: memberships.map(&:as_dashboard_json)
    }
  end

  private

  attr_reader :shop

  def active_count(memberships)
    memberships.count { |m| m.status != 'expired' }
  end

  def expiring_count(memberships)
    memberships.count { |m| m.status == 'expiring' }
  end

  def revenue_this_month
    paid_invoices.where(created_at: Time.zone.now.all_month).sum(:amount)
  end

  def daily_revenue_30_days
    start_date = 29.days.ago.to_date
    end_date = Time.zone.today
    sums_by_date = fetch_daily_revenue_sums(start_date, end_date)

    (start_date..end_date).map do |date|
      date_str = date.iso8601
      { date: date_str, revenue: (sums_by_date[date_str] || 0).to_i }
    end
  end

  def fetch_daily_revenue_sums(start_date, end_date)
    paid_invoices
      .where(created_at: start_date.beginning_of_day..end_date.end_of_day)
      .group('DATE(invoices.created_at)')
      .sum(:amount)
      .transform_keys { |k| k.to_date.iso8601 }
  end

  def check_in_frequency_by_hour
    counts_by_hour = fetch_hourly_check_in_counts

    (0..23).map do |hour|
      { hour: hour, label: format('%<hour>02d:00', hour: hour), count: (counts_by_hour[hour] || 0).to_i }
    end
  end

  def fetch_hourly_check_in_counts
    CheckIn
      .joins(:membership)
      .where(memberships: { shop_id: shop.id })
      .group('EXTRACT(HOUR FROM check_ins.checked_in_at)')
      .count
      .transform_keys { |k| k.to_f.to_i }
  end

  def calculate_peak_hour(hourly_check_ins)
    peak = hourly_check_ins.max_by { |h| h[:count] }
    return nil if peak.nil? || peak[:count].zero?

    next_hour = (peak[:hour] + 1) % 24
    time_label = format('%<h1_label>02d:00 - %<h2_label>02d:00', h1_label: peak[:hour], h2_label: next_hour)
    rec = "Khung giờ cao điểm: #{time_label} (#{peak[:count]} lượt). Khuyên dùng: Xếp thêm nhân viên phục vụ."
    { hour: peak[:hour], label: time_label, count: peak[:count], recommendation: rec }
  end

  def paid_invoices
    Invoice.joins(:membership).where(memberships: { shop_id: shop.id }, status: 'paid')
  end
end
