# frozen_string_literal: true

# Service object to unfreeze a membership.
# Calculates frozen days, extends expires_at for day-based packages,
# clears freeze fields, restores status, and logs audit event.
class UnfreezeMembership
  class Error < StandardError; end
  class NotFrozenError < Error; end

  def self.call(membership:, staff: nil, reason: nil)
    new(membership: membership, staff: staff, reason: reason).call
  end

  def initialize(membership:, staff: nil, reason: nil)
    @membership = membership
    @staff = staff
    @reason = reason
  end

  def call
    membership.with_lock do
      validate_frozen!

      @freeze_started_on = membership.frozen_at&.to_date || Date.current
      @freeze_ended_on = effective_freeze_end
      days_frozen = calculate_frozen_days
      extend_expiry_if_applicable!(days_frozen)
      clear_freeze_state!
      log_audit!(days_frozen)

      membership.reload
    end
  end

  private

  attr_reader :membership, :staff, :reason

  def validate_frozen!
    return if membership.status == 'frozen' || membership.frozen_at.present?

    raise NotFrozenError, I18n.t('errors.membership.not_frozen', default: 'Thẻ hội viên không trong trạng thái bảo lưu')
  end

  def calculate_frozen_days
    [(@freeze_ended_on - @freeze_started_on).to_i, 0].max
  end

  def effective_freeze_end
    end_date = Date.current
    return membership.frozen_until + 1 if membership.frozen_until.present? && end_date > membership.frozen_until

    end_date
  end

  def extend_expiry_if_applicable!(days_frozen)
    return if membership.expires_at.blank?

    membership.expires_at = membership.expires_at + days_frozen.days
  end

  def clear_freeze_state!
    membership.frozen_at = nil
    membership.frozen_until = nil
    membership.freeze_reason = nil
    membership.status = membership.calculate_status
    membership.save!(validate: false)
  end

  def log_audit!(days_frozen)
    AuditLog.log_membership_unfrozen!(
      shop: membership.shop,
      staff: staff,
      membership: membership,
      days_extended: days_frozen,
      new_expires_at: membership.expires_at,
      reason: reason,
      freeze_started_on: @freeze_started_on.to_s,
      freeze_ended_on: @freeze_ended_on.to_s
    )
  end
end
