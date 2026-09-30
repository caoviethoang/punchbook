# frozen_string_literal: true

class AuditLogsController < ApiController
  def index
    combined = build_combined_logs

    render json: {
      audit_logs: combined,
      meta: { total: combined.size, page: params[:page]&.to_i || 1 }
    }
  end

  private

  def build_combined_logs
    logs = filter_logs(current_shop.audit_logs.includes(:staff).recent).map { |log| format_log(log) }
    versions = fetch_paper_trail_versions.map { |v| format_version(v) }
    combine_entries(logs, versions)
  end

  def combine_entries(logs, versions)
    (logs + versions)
      .uniq { |item| [item[:action], item[:target_type], item[:target_id], item[:created_at]] }
      .sort_by { |item| item[:created_at] }
      .reverse
      .take(50)
  end

  def filter_logs(logs)
    logs = logs.by_action(params[:log_action]) if params[:log_action].present?
    logs = logs.by_staff(params[:staff_id]) if params[:staff_id].present?
    logs
  end

  def fetch_paper_trail_versions
    membership_ids = current_shop.memberships.pluck(:id)
    check_in_ids = current_shop.check_ins.pluck(:id)

    PaperTrail::Version
      .where(item_type: 'Membership', item_id: membership_ids)
      .or(PaperTrail::Version.where(item_type: 'CheckIn', item_id: check_in_ids))
      .order(created_at: :desc)
      .limit(50)
  rescue StandardError
    PaperTrail::Version.none
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

  def format_version(version)
    {
      id: version.id,
      action: version_action(version),
      staff_name: version.whodunnit,
      target_type: version.item_type,
      target_id: version.item_id,
      details: { event: version.event, changes: version.changeset },
      created_at: version.created_at.iso8601
    }
  end

  def version_action(version)
    case version.item_type
    when 'CheckIn' then 'check_in'
    when 'Membership'
      version.event == 'create' ? 'membership_created' : 'membership_renewed'
    else version.event
    end
  end
end
