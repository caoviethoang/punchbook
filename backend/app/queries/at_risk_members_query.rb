# frozen_string_literal: true

# Evaluates active/expiring shop memberships for churn risk based on visit cadence
# (days since last check-in vs average interval and 30-day frequency drop).
class AtRiskMembersQuery
  RISK_ORDER = { 'high' => 0, 'medium' => 1, 'low' => 2 }.freeze

  def self.call(shop, now: Time.current)
    new(shop, now: now).to_h
  end

  def self.at_risk_membership_ids(shop, now: Time.current)
    new(shop, now: now).at_risk_items.pluck(:membership_id)
  end

  def initialize(shop, now: Time.current)
    @shop = shop
    @now = now
  end

  def to_h
    items = at_risk_items
    { summary: build_summary(items), members: items }
  end

  def at_risk_items
    @at_risk_items ||= begin
      rows = eligible_memberships.filter_map { |m| evaluate_membership(m, check_ins_by_member[m.id] || []) }
      rows.sort_by { |item| [RISK_ORDER.fetch(item[:risk_level], 9), -item[:days_since_last_visit]] }
    end
  end

  private

  attr_reader :shop, :now

  def eligible_memberships
    @eligible_memberships ||= shop.memberships.where(status: %w[active expiring]).includes(:package).to_a
  end

  def check_ins_by_member
    @check_ins_by_member ||= eligible_memberships.empty? ? {} : fetch_grouped_check_ins
  end

  def fetch_grouped_check_ins
    CheckIn.where(membership_id: eligible_memberships.map(&:id), checked_in_at: (now - 60.days)..now)
           .pluck(:membership_id, :checked_in_at)
           .group_by(&:first)
           .transform_values { |pairs| pairs.map(&:last).compact }
  end

  def evaluate_membership(membership, timestamps)
    metrics = compute_metrics(membership, timestamps)
    risk = classify_risk(metrics)
    return nil unless risk

    member_base_hash(membership).merge(member_metrics_hash(membership, metrics, risk))
  end

  def compute_metrics(membership, timestamps)
    recent, prior = timestamps.partition { |ts| ts >= now - 30.days }.map(&:size)
    last_at = timestamps.max || membership.created_at
    {
      last_at: timestamps.max, days_since: [(now - last_at) / 1.day, 0].max.floor,
      recent_30d: recent, prior_30d: prior,
      avg_interval: average_interval_days(timestamps), drop_pct: frequency_drop_pct(recent, prior)
    }
  end

  def frequency_drop_pct(recent, prior)
    prior.positive? ? [(((prior - recent) / prior.to_f) * 100).round, 0].max : 0
  end

  def average_interval_days(timestamps)
    return 14.0 if timestamps.size < 2

    (((timestamps.max - timestamps.min) / 1.day) / (timestamps.size - 1)).round(1)
  end

  def classify_risk(metrics)
    return 'high' if high_risk?(metrics)
    return 'medium' if medium_risk?(metrics)
    return 'low' if low_risk?(metrics)

    nil
  end

  def high_risk?(metrics)
    metrics[:days_since] >= 21 ||
      (metrics[:prior_30d] >= 4 && metrics[:drop_pct] >= 70 && metrics[:days_since] >= 10) ||
      (metrics[:days_since] >= 14 && metrics[:avg_interval] <= 5)
  end

  def medium_risk?(metrics)
    metrics[:days_since] >= 14 || (metrics[:prior_30d] >= 2 && metrics[:drop_pct] >= 50 && metrics[:days_since] >= 7)
  end

  def low_risk?(metrics)
    metrics[:days_since] >= 7 && (metrics[:avg_interval] <= 4 || metrics[:drop_pct] >= 30)
  end

  def member_base_hash(membership)
    {
      membership_id: membership.id, customer_name: membership.customer_name,
      phone: membership.phone, email: membership.email,
      package_name: membership.package.name, package_price: membership.package.price.to_i,
      sessions_left: membership.sessions_left, expires_at: membership.expires_at&.to_s
    }
  end

  def member_metrics_hash(membership, metrics, risk)
    {
      risk_level: risk, days_since_last_visit: metrics[:days_since],
      recent_30d_visits: metrics[:recent_30d], prior_30d_visits: metrics[:prior_30d],
      frequency_drop_pct: metrics[:drop_pct], last_checked_in_at: metrics[:last_at]&.iso8601,
      last_reengagement_sent_at: membership.last_reengagement_sent_at&.iso8601
    }
  end

  def build_summary(items)
    {
      total_at_risk: items.size, high_risk_count: items.count { |i| i[:risk_level] == 'high' },
      medium_risk_count: items.count { |i| i[:risk_level] == 'medium' },
      low_risk_count: items.count { |i| i[:risk_level] == 'low' },
      revenue_at_stake: items.sum { |i| i[:package_price] }
    }
  end
end
