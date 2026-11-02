# frozen_string_literal: true

# Service object to freeze/hold a membership.
# Blocks check-in, records frozen_at, frozen_until, freeze_reason, and sets status to 'frozen'.
class FreezeMembership
  class Error < StandardError; end
  class IneligibleMembershipError < Error; end
  class InvalidFreezeDateError < Error; end

  def self.call(membership:, freeze_until:, staff: nil, reason: nil)
    new(membership: membership, staff: staff, freeze_until: freeze_until, reason: reason).call
  end

  def initialize(membership:, freeze_until:, staff: nil, reason: nil)
    @membership = membership
    @staff = staff
    @freeze_until = parse_freeze_until(freeze_until)
    @reason = reason.to_s.strip.presence
  end

  def call
    membership.with_lock do
      validate_eligibility!
      validate_freeze_date!

      apply_freeze!
      log_audit!

      membership.reload
    end
  end

  private

  attr_reader :membership, :staff, :freeze_until, :reason

  def parse_freeze_until(date_or_str)
    date_or_str.is_a?(Date) ? date_or_str : Date.parse(date_or_str.to_s)
  rescue ArgumentError, TypeError
    raise InvalidFreezeDateError,
          I18n.t('errors.membership.invalid_freeze_date', default: 'Ngày kết thúc bảo lưu không hợp lệ')
  end

  def validate_eligibility!
    if membership.status == 'frozen'
      raise IneligibleMembershipError,
            I18n.t('errors.membership.already_frozen', default: 'Thẻ hội viên đã trong trạng thái bảo lưu')
    end

    return unless membership.status == 'expired'

    raise IneligibleMembershipError,
          I18n.t('errors.membership.cannot_freeze_expired',
                 default: 'Không thể bảo lưu thẻ đã hết hạn hoặc hết số buổi')
  end

  def validate_freeze_date!
    validate_future_date!
    validate_freeze_duration!
  end

  def validate_future_date!
    return unless freeze_until <= Date.current

    raise InvalidFreezeDateError,
          I18n.t('errors.membership.freeze_date_must_be_future',
                 default: 'Ngày kết thúc bảo lưu phải sau ngày hôm nay')
  end

  def validate_freeze_duration!
    freeze_days = (freeze_until - Date.current).to_i
    max_days = membership.shop.max_freeze_days_per_year || 30
    return unless freeze_days > max_days

    raise InvalidFreezeDateError,
          I18n.t('errors.membership.freeze_days_exceeded', max: max_days,
                                                           default: "Thời gian bảo lưu tối đa là #{max_days} ngày")
  end

  def apply_freeze!
    membership.frozen_at = Time.current
    membership.frozen_until = freeze_until
    membership.freeze_reason = reason
    membership.status = 'frozen'
    membership.save!(validate: false)
  end

  def log_audit!
    AuditLog.log_membership_frozen!(
      shop: membership.shop,
      staff: staff,
      membership: membership,
      frozen_until: freeze_until,
      reason: reason
    )
  end
end
