# frozen_string_literal: true

class CheckInMembership
  class Error < StandardError; end
  class InsufficientSessionsError < Error; end
  class MembershipExpiredError < Error; end
  class MembershipFrozenError < Error; end
  class MembershipTransferredError < Error; end

  def self.call(membership:, staff:, extra_audit_details: {})
    new(membership: membership, staff: staff, extra_audit_details: extra_audit_details).call
  end

  def initialize(membership:, staff:, extra_audit_details: {})
    @membership = membership
    @staff = staff
    @extra_audit_details = extra_audit_details
  end

  def call
    membership.with_lock do
      validate_eligibility!
      process_check_in!
    end
  end

  private

  attr_reader :membership, :staff, :extra_audit_details

  def validate_eligibility!
    validate_frozen_status!
    validate_transferred_status!

    if membership.package.session_based?
      validate_sessions_available!
    else
      validate_expiry_date!
    end
  end

  def validate_frozen_status!
    return unless membership.status == 'frozen' || membership.frozen?

    date_str = membership.frozen_until&.strftime('%d/%m/%Y') || ''
    default_msg = "Hội viên đang trong thời gian bảo lưu (đến ngày #{date_str}). " \
                  'Vui lòng mở khóa trước khi check-in.'
    msg = I18n.t('errors.membership.frozen', date: date_str, default: default_msg)
    raise MembershipFrozenError, msg
  end

  def validate_transferred_status!
    return unless membership.status == 'transferred' || membership.transferred?

    raise MembershipTransferredError,
          I18n.t('errors.membership.transferred',
                 default: 'Thẻ hội viên đã được chuyển nhượng, không thể check-in.')
  end

  def validate_sessions_available!
    return unless membership.no_sessions_left?

    raise InsufficientSessionsError,
          I18n.t('errors.membership.no_sessions_left', default: 'Membership has no sessions left')
  end

  def validate_expiry_date!
    return unless membership.expired? || membership.expires_at.blank?

    raise MembershipExpiredError, I18n.t('errors.membership.expired', default: 'Membership has expired')
  end

  def process_check_in!
    decrement_sessions_if_needed!
    check_in = create_check_in_record!
    log_audit_event!(check_in)
    check_in
  end

  def decrement_sessions_if_needed!
    membership.update!(sessions_left: membership.sessions_left - 1) if membership.package.session_based?
  end

  def create_check_in_record!
    CheckIn.create!(membership: membership, staff: staff, checked_in_at: Time.current)
  end

  def log_audit_event!(check_in)
    AuditLog.log_check_in!(
      shop: membership.shop, staff: staff, membership: membership, checked_in_at: check_in.checked_in_at,
      **extra_audit_details
    )
  end
end
