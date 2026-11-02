# frozen_string_literal: true

# Shop-scoped monthly attendance report query:
# Returns summary metrics and ranked attendance records for each membership.
class AttendanceReportQuery
  def self.call(shop, month_str = nil)
    new(shop, month_str).to_h
  end

  def initialize(shop, month_str = nil)
    @shop = shop
    @month_str = month_str.to_s.strip
  end

  def to_h
    {
      month: target_month_string,
      start_date: month_range.begin.to_date.to_s,
      end_date: month_range.end.to_date.to_s,
      summary: summary,
      attendance: ranked_attendance
    }
  end

  def ranked_attendance
    @ranked_attendance ||= assign_ranks(raw_attendance_items)
  end

  def target_month_string
    target_date.strftime('%Y-%m')
  end

  def target_date
    @target_date ||= parse_target_date
  end

  def month_range
    @month_range ||= target_date.in_time_zone.all_month
  end

  private

  attr_reader :shop, :month_str

  def parse_target_date
    if month_str.match?(/\A\d{4}-\d{2}\z/)
      Date.strptime(month_str, '%Y-%m')
    else
      Time.zone.today
    end
  rescue ArgumentError
    Time.zone.today
  end

  def summary
    items = ranked_attendance
    active = items.count { |i| !i[:is_inactive] }
    total_ci = items.sum { |i| i[:check_ins_count] }

    {
      total_members: items.size,
      active_members_count: active,
      inactive_members_count: items.size - active,
      total_check_ins: total_ci,
      avg_check_ins_per_active_member: calculate_average(total_ci, active)
    }
  end

  def calculate_average(total, active)
    active.positive? ? (total.to_f / active).round(1) : 0.0
  end

  def raw_attendance_items
    stats = fetch_check_in_stats
    shop.memberships.includes(:package).order(:customer_name).map do |m|
      build_attendance_item(m, stats[m.id] || { count: 0, last_at: nil })
    end
  end

  def build_attendance_item(mem, stat)
    count = stat[:count]
    membership_base_attributes(mem).merge(
      check_ins_count: count,
      last_check_in_at: stat[:last_at]&.iso8601,
      is_inactive: count.zero?
    )
  end

  def membership_base_attributes(mem)
    {
      membership_id: mem.id, customer_name: mem.customer_name, phone: mem.phone,
      package_name: mem.package&.name || 'Gói đã xóa', status: mem.status,
      sessions_left: mem.sessions_left, expires_at: mem.expires_at&.to_date&.to_s
    }
  end

  def fetch_check_in_stats
    CheckIn.joins(:membership)
           .where(memberships: { shop_id: shop.id })
           .where(checked_in_at: month_range)
           .group(:membership_id)
           .pluck(:membership_id, Arel.sql('COUNT(*)'), Arel.sql('MAX(check_ins.checked_in_at)'))
           .to_h { |id, count, last_at| [id, { count: count.to_i, last_at: last_at }] }
  end

  def assign_ranks(items)
    current_rank = 1
    sort_attendance_items(items).map do |item|
      rank = item[:check_ins_count].positive? ? current_rank : nil
      current_rank += 1 if rank
      item.merge(rank: rank)
    end
  end

  def sort_attendance_items(items)
    items.sort_by do |item|
      [
        -item[:check_ins_count],
        item[:last_check_in_at] ? -Time.zone.parse(item[:last_check_in_at]).to_i : 0,
        item[:customer_name]
      ]
    end
  end
end
