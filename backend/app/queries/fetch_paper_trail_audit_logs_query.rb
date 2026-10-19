# frozen_string_literal: true

# Fetches and formats PaperTrail::Version entries for a shop's audit log feed.
class FetchPaperTrailAuditLogsQuery
  MAX_ENTRIES = 50

  def self.call(shop, params = {})
    new(shop, params).call
  end

  def initialize(shop, params = {})
    @shop = shop
    @params = params
  end

  def call
    fetch_versions.map { |v| format_version(v) }
  end

  private

  attr_reader :shop, :params

  def fetch_versions
    action = params[:log_action]
    return PaperTrail::Version.none if action.present? && !paper_trail_action?(action)

    query = base_paper_trail_query(action)
    query = apply_staff_paper_trail_filter(query)
    query.includes(:item).order(created_at: :desc).limit(MAX_ENTRIES)
  rescue StandardError
    PaperTrail::Version.none
  end

  def base_paper_trail_query(action)
    m_ids = shop.memberships.select(Arel.sql('memberships.id::text'))
    c_ids = shop.check_ins.select(Arel.sql('check_ins.id::text'))

    scoped_paper_trail_query(action, m_ids, c_ids)
  end

  def scoped_paper_trail_query(action, m_ids, c_ids)
    case action
    when 'check_in' then PaperTrail::Version.where(item_type: 'CheckIn', item_id: c_ids)
    when 'membership_created' then PaperTrail::Version.where(item_type: 'Membership', item_id: m_ids, event: 'create')
    when 'membership_renewed'
      PaperTrail::Version.where(item_type: 'Membership', item_id: m_ids).where.not(event: 'create')
    else
      PaperTrail::Version.where(item_type: 'Membership', item_id: m_ids)
                         .or(PaperTrail::Version.where(item_type: 'CheckIn', item_id: c_ids))
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
