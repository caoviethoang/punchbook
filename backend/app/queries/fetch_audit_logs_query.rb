# frozen_string_literal: true

# Query object to fetch, filter, and combine AuditLog entries with PaperTrail Version entries.
class FetchAuditLogsQuery
  MAX_ENTRIES = 50

  def self.call(shop, params = {})
    new(shop, params).call
  end

  def initialize(shop, params = {})
    @shop = shop
    @params = params
  end

  def call
    logs = filter_logs(shop.audit_logs.includes(:staff).recent).map { |log| format_log(log) }
    versions = FetchPaperTrailAuditLogsQuery.call(shop, params)
    combine_entries(logs, versions)
  end

  private

  attr_reader :shop, :params

  def filter_logs(logs)
    logs = logs.by_action(params[:log_action]) if params[:log_action].present?
    logs = logs.by_staff(params[:staff_id]) if params[:staff_id].present?
    logs
  end

  def combine_entries(logs, versions)
    (logs + versions)
      .uniq { |item| [item[:action], item[:target_type], item[:target_id], item[:created_at]] }
      .sort_by { |item| item[:created_at] }
      .reverse
      .take(MAX_ENTRIES)
  end

  def format_log(log)
    {
      id: log.id,
      action: log.action,
      staff_name: log.staff&.name,
      target_type: log.target_type,
      target_id: log.target_id,
      details: log.details || {},
      created_at: log.created_at.iso8601
    }
  end
end
