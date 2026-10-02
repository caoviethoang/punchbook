# frozen_string_literal: true

# rubocop:disable Metrics/ClassLength

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
    versions = fetch_paper_trail_versions.map { |v| format_version(v) }
    combine_entries(logs, versions)
  end

  private

  attr_reader :shop, :params

  def filter_logs(logs)
    logs = logs.by_action(params[:log_action]) if params[:log_action].present?
    logs = logs.by_staff(params[:staff_id]) if params[:staff_id].present?
    logs
  end

  def fetch_paper_trail_versions
    action = params[:log_action]
    return PaperTrail::Version.none if action.present? && !paper_trail_action?(action)

    query = base_paper_trail_query(action)
    query = apply_staff_paper_trail_filter(query)
    query.includes(:item).order(created_at: :desc).limit(MAX_ENTRIES)
  rescue StandardError
    PaperTrail::Version.none
  end

  def base_paper_trail_query(action)
    base = PaperTrail::Version
    m_ids = shop.memberships.select(:id)
    c_ids = shop.check_ins.select(:id)

    case action
    when 'check_in' then base.where(item_type: 'CheckIn', item_id: c_ids)
    when 'membership_created' then base.where(item_type: 'Membership', item_id: m_ids, event: 'create')
    when 'membership_renewed' then base.where(item_type: 'Membership', item_id: m_ids).where.not(event: 'create')
    else base.where(item_type: 'Membership', item_id: m_ids).or(base.where(item_type: 'CheckIn', item_id: c_ids))
    end
  end

  def apply_staff_paper_trail_filter(query)
    return query if params[:staff_id].blank?

    staff_name = shop.staffs.find_by(id: params[:staff_id])&.name
    staff_name ? query.where(whodunnit: staff_name) : query
  end

  def paper_trail_action?(action)
    %w[check_in membership_created membership_renewed].include?(action.to_s)
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

  def format_version(version)
    action = version_action(version)
    {
      id: version.id,
      action: action,
      staff_name: version.whodunnit,
      target_type: version.item_type,
      target_id: version.item_id,
      details: build_version_details(version, action),
      created_at: version.created_at.iso8601
    }
  end

  def build_version_details(version, action)
    item = version.item
    return { event: version.event, changes: version.changeset } unless item

    case action
    when 'membership_created', 'membership_renewed'
      membership_details(item, version)
    when 'check_in'
      check_in_details(item)
    else
      { event: version.event, changes: version.changeset }
    end
  end

  def membership_details(item, version)
    {
      customer_name: item.customer_name,
      phone: item.phone,
      package_name: item.package&.name,
      sessions_before: version.changeset['sessions_left']&.first,
      sessions_after: version.changeset['sessions_left']&.last || item.sessions_left
    }.compact
  end

  def check_in_details(item)
    {
      membership_name: item.membership&.customer_name,
      package_name: item.membership&.package&.name,
      sessions_after: item.membership&.sessions_left
    }.compact
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
# rubocop:enable Metrics/ClassLength
