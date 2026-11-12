# frozen_string_literal: true

# Weekly background job that scans active shop memberships for churn risk,
# updates churn_risk_level tags, and logs retention metrics.
class ScanAtRiskMembersJob < ApplicationJob
  queue_as :default

  def perform(shop_id = nil)
    shops = shop_id ? Shop.where(id: shop_id) : Shop.all
    shops.find_each { |shop| scan_shop(shop) }
  end

  private

  def scan_shop(shop)
    report = AtRiskMembersQuery.call(shop)
    now = Time.current
    at_risk_map = report[:members].to_h { |item| [item[:membership_id], item[:risk_level]] }

    update_at_risk_members(shop, at_risk_map, now)
    clear_recovered_members(shop, at_risk_map.keys, now)
    log_retention_metrics(shop, report[:summary])
  end

  def update_at_risk_members(shop, at_risk_map, scored_at)
    %w[high medium low].each do |level|
      ids = at_risk_map.select { |_, risk| risk == level }.keys
      next if ids.empty?

      shop.memberships.where(id: ids).update_all(churn_risk_level: level, churn_risk_scored_at: scored_at) # rubocop:disable Rails/SkipsModelValidations
    end
  end

  def clear_recovered_members(shop, at_risk_ids, scored_at)
    scope = shop.memberships.where.not(churn_risk_level: nil)
    scope = scope.where.not(id: at_risk_ids) if at_risk_ids.any?
    scope.update_all(churn_risk_level: nil, churn_risk_scored_at: scored_at) # rubocop:disable Rails/SkipsModelValidations
  end

  def log_retention_metrics(shop, summary)
    Rails.logger.info(
      "[ScanAtRiskMembersJob] Shop #{shop.id} (#{shop.name}): " \
      "total_at_risk=#{summary[:total_at_risk]}, high=#{summary[:high_risk_count]}, " \
      "medium=#{summary[:medium_risk_count]}, low=#{summary[:low_risk_count]}, " \
      "revenue_at_stake=#{summary[:revenue_at_stake]}"
    )
  end
end
