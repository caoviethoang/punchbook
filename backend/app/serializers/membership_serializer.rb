# frozen_string_literal: true

# Responsible for converting a Membership into JSON-safe hashes.
# Keeps the model free of presentation concerns.
# rubocop:disable Metrics/ClassLength
class MembershipSerializer
  ASSOCIATION_INCLUDES = {
    package: { only: %i[id name price sessions_count duration_days] },
    shop: { only: %i[id name phone address] }
  }.freeze

  def self.batch_api_json(memberships)
    return [] if memberships.blank?

    summaries = fetch_checkin_summaries(memberships.map(&:id))
    memberships.map do |membership|
      new(membership, checkin_summary: summaries[membership.id]).as_api_json
    end
  end

  class << self
    alias batch_dashboard_json batch_api_json
  end

  def self.fetch_checkin_summaries(membership_ids)
    return {} if membership_ids.blank?

    summaries = default_checkin_summaries(membership_ids)
    query_checkin_summaries(membership_ids).each do |id, last_at, checked_today|
      summaries[id] = { last_checked_in_at: last_at, checked_in_today: checked_today ? true : false }
    end
    summaries
  end

  def self.default_checkin_summaries(membership_ids)
    membership_ids.index_with { { last_checked_in_at: nil, checked_in_today: false } }
  end

  def self.query_checkin_summaries(membership_ids)
    range_sql = CheckIn.sanitize_sql_array(
      ['(check_ins.checked_in_at BETWEEN :start AND :end)',
       { start: Time.zone.now.beginning_of_day, end: Time.zone.now.end_of_day }]
    )

    CheckIn.where(membership_id: membership_ids)
           .where.not(checked_in_at: nil)
           .group(:membership_id)
           .pluck(:membership_id, Arel.sql('MAX(check_ins.checked_in_at)'), Arel.sql("BOOL_OR(#{range_sql})"))
  end

  def initialize(membership, checkin_summary: nil)
    @membership = membership
    @checkin_summary = checkin_summary
  end

  # Used by MembershipsController (index, create, check_in) and InvoicesController.
  def as_api_json
    membership.as_json(
      only: %i[id customer_name phone card_number sessions_left expires_at discarded_at notes
               frozen_at frozen_until freeze_reason transferred_at
               transferred_to_membership_id transferred_from_membership_id],
      include: ASSOCIATION_INCLUDES
    ).merge(status_and_qr_hash)
  end

  # Used by DashboardController — adds the computed status field.
  def as_dashboard_json
    as_api_json
  end

  # Used by MembershipsController#show — detailed view with check_ins and invoices.
  def as_detail_json
    base = membership.as_json(
      only: %i[id customer_name phone card_number sessions_left expires_at created_at notes
               frozen_at frozen_until freeze_reason transferred_at
               transferred_to_membership_id transferred_from_membership_id],
      include: ASSOCIATION_INCLUDES
    )
    base.merge(extra_detail_hash)
  end

  private

  attr_reader :membership, :checkin_summary

  def status_and_qr_hash
    status = membership.discarded? ? 'deleted' : membership.status
    {
      'status' => status,
      'discarded_at' => membership.discarded_at,
      'checked_in_today' => checked_in_today_value,
      'last_checked_in_at' => last_checked_in_at_value,
      'qr_code_value' => "PUNCHBOOK:#{membership.id}"
    }.merge(freeze_attributes_hash).merge(transfer_meta_hash)
  end

  def freeze_attributes_hash
    {
      'is_frozen' => membership.frozen?,
      'frozen_at' => membership.frozen_at&.iso8601,
      'frozen_until' => membership.frozen_until&.to_s,
      'freeze_reason' => membership.freeze_reason
    }
  end

  def transfer_meta_hash
    {
      'is_transferred' => membership.transferred?,
      'transferred_at' => membership.transferred_at&.iso8601,
      'transferred_to_name' => membership.transferred_to_membership&.customer_name,
      'transferred_from_name' => membership.transferred_from_membership&.customer_name
    }
  end

  def checked_in_today_value
    return checkin_summary[:checked_in_today] if checkin_summary

    membership.checked_in_today?
  end

  def last_checked_in_at_value
    return checkin_summary[:last_checked_in_at] if checkin_summary

    membership.last_checked_in_at
  end

  def extra_detail_hash
    status_and_qr_hash.merge(
      'check_ins' => serialized_check_ins,
      'invoices' => serialized_invoices,
      'freeze_history' => serialized_freeze_history,
      'transfers' => serialized_transfers
    )
  end

  def serialized_freeze_history
    freeze_audit_logs.map do |log|
      {
        'id' => log.id,
        'action' => log.action,
        'created_at' => log.created_at&.iso8601,
        'staff_name' => log.staff&.name || 'Hệ thống',
        'details' => log.details
      }
    end
  end

  def freeze_audit_logs
    membership.shop.audit_logs
              .where(target_type: 'Membership', target_id: membership.id,
                     action: %w[membership_frozen membership_unfrozen])
              .includes(:staff)
              .order(created_at: :desc)
  end

  def serialized_transfers
    transfers = (membership.outgoing_transfers.includes(:staff, :target_membership) +
                 membership.incoming_transfers.includes(:staff, :source_membership))
    transfers.sort_by(&:created_at).reverse.map(&:as_api_json)
  end

  def serialized_check_ins
    membership.check_ins.includes(:staff).order(checked_in_at: :desc).map do |check_in|
      {
        'id' => check_in.id,
        'checked_in_at' => check_in.checked_in_at,
        'staff' => format_check_in_staff(check_in.staff)
      }
    end
  end

  def format_check_in_staff(staff)
    return { 'id' => nil, 'name' => 'Hệ thống' } if staff.blank?

    { 'id' => staff.id, 'name' => staff.name }
  end

  def serialized_invoices
    membership.invoices.order(created_at: :desc).map(&:as_api_json)
  end
end
# rubocop:enable Metrics/ClassLength
