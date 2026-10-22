# frozen_string_literal: true

# Service object for renewing a membership with an existing or new package.
# Handles session addition, validity extension, paid invoice creation, audit logging,
# and optional auto-check-in in a single transaction.
class RenewMembership
  class Error < StandardError; end
  class InvalidPackageError < Error; end

  def self.call(membership:, staff:, package: nil, auto_check_in: false)
    new(membership: membership, staff: staff, package: package, auto_check_in: auto_check_in).call
  end

  def initialize(membership:, staff:, package: nil, auto_check_in: false)
    @membership = membership
    @staff = staff
    @package = package || membership.package
    @auto_check_in = auto_check_in
  end

  def call
    validate_package!

    membership.with_lock do
      sessions_before = membership.sessions_left
      expires_at_before = membership.expires_at

      apply_package_renewal!
      invoice = create_paid_invoice!
      log_audit!(sessions_before, expires_at_before)
      check_in = process_auto_check_in_if_requested!

      { membership: membership.reload, invoice: invoice, check_in: check_in }
    end
  end

  private

  attr_reader :membership, :staff, :package, :auto_check_in

  def validate_package!
    return unless package.blank? || package.shop_id != membership.shop_id || package.discarded?

    raise InvalidPackageError, 'Gói tập không hợp lệ hoặc đã bị vô hiệu hóa'
  end

  def apply_package_renewal!
    membership.package = package if package.id != membership.package_id

    if package.session_based?
      renew_session_package!
    elsif package.day_based?
      renew_day_package!
    end

    membership.save!
  end

  def renew_session_package!
    current_sessions = membership.sessions_left.to_i
    membership.sessions_left = [current_sessions, 0].max + package.sessions_count.to_i
    membership.expires_at = nil
  end

  def renew_day_package!
    base_date = renewal_base_date
    membership.expires_at = base_date + package.duration_days.days
    membership.sessions_left = nil
  end

  def renewal_base_date
    if membership.expires_at.present? && membership.expires_at >= Date.current
      membership.expires_at
    else
      Date.current
    end
  end

  def create_paid_invoice!
    membership.invoices.create!(
      amount: package.price || 0,
      status: 'paid'
    )
  end

  def log_audit!(sessions_before, expires_at_before)
    AuditLog.log_membership_renewed!(
      shop: membership.shop,
      staff: staff,
      membership: membership,
      sessions_before: sessions_before,
      expires_at_before: expires_at_before
    )
  end

  def process_auto_check_in_if_requested!
    return nil unless auto_check_in

    CheckInMembership.call(membership: membership, staff: staff)
  end
end
