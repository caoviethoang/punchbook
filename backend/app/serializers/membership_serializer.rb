# frozen_string_literal: true

# Responsible for converting a Membership into JSON-safe hashes.
# Keeps the model free of presentation concerns.
class MembershipSerializer
  ASSOCIATION_INCLUDES = {
    package: { only: %i[id name price sessions_count duration_days] },
    shop: { only: %i[id name phone address] }
  }.freeze

  def initialize(membership)
    @membership = membership
  end

  # Used by MembershipsController (index, create, check_in) and InvoicesController.
  def as_api_json
    membership.as_json(
      only: %i[id customer_name phone card_number sessions_left expires_at discarded_at notes],
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
      only: %i[id customer_name phone card_number sessions_left expires_at created_at notes],
      include: ASSOCIATION_INCLUDES
    )
    base.merge(extra_detail_hash)
  end

  private

  attr_reader :membership

  def status_and_qr_hash
    status = membership.discarded? ? 'deleted' : membership.status
    {
      'status' => status,
      'discarded_at' => membership.discarded_at,
      'checked_in_today' => membership.checked_in_today?,
      'last_checked_in_at' => membership.last_checked_in_at,
      'qr_code_value' => "PUNCHBOOK:#{membership.id}"
    }
  end

  def extra_detail_hash
    status_and_qr_hash.merge(
      'check_ins' => serialized_check_ins,
      'invoices' => serialized_invoices
    )
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
