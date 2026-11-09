# frozen_string_literal: true

# Service object to securely transfer a membership to another customer.
# Handles session and day-based balances, recipient creation/crediting,
# optional transfer fees with invoices, and audit logging.
# rubocop:disable Metrics/ClassLength
class TransferMembership
  class Error < StandardError; end
  class IneligibleMembershipError < Error; end
  class InvalidTargetError < Error; end

  # rubocop:disable Metrics/ParameterLists
  def self.call(source_membership:, target_customer_name:, target_phone:, staff: nil, transfer_fee: 0, note: nil)
    new(
      source_membership: source_membership,
      target_customer_name: target_customer_name,
      target_phone: target_phone,
      staff: staff,
      transfer_fee: transfer_fee,
      note: note
    ).call
  end

  def initialize(source_membership:, target_customer_name:, target_phone:, staff: nil, transfer_fee: 0, note: nil)
    @source = source_membership
    @target_name = target_customer_name.to_s.strip
    @target_phone = target_phone.to_s.strip
    @staff = staff
    @transfer_fee = transfer_fee.to_i
    @note = note.to_s.strip.presence
  end
  # rubocop:enable Metrics/ParameterLists

  def call
    source.with_lock do
      validate_eligibility!
      validate_target_params!

      execute_transfer!
    end
  end

  private

  attr_reader :source, :target_name, :target_phone, :staff, :transfer_fee, :note

  def execute_transfer!
    sessions = calculate_sessions_to_transfer
    days = calculate_days_to_transfer

    target = find_or_create_target_membership!(sessions, days)
    invoice = create_transfer_invoice!(target)
    transfer = record_transfer!(target, invoice, sessions, days)

    finalize_source!(target)
    log_audit!(target, transfer)

    { source_membership: source.reload, target_membership: target.reload, transfer: transfer, invoice: invoice }
  end

  def validate_eligibility!
    validate_not_transferred!

    if source.package.session_based?
      validate_sessions_available!
    else
      validate_not_expired!
    end
  end

  def validate_not_transferred!
    return unless source.discarded? || source.transferred?

    raise IneligibleMembershipError,
          I18n.t('errors.membership.already_transferred', default: 'Thẻ hội viên đã được chuyển nhượng.')
  end

  def validate_sessions_available!
    return if source.sessions_left.to_i.positive?

    raise IneligibleMembershipError,
          I18n.t('errors.membership.no_sessions_to_transfer', default: 'Thẻ đã hết số buổi, không thể chuyển nhượng.')
  end

  def validate_not_expired!
    return if source.expires_at.present? && source.expires_at > Date.current

    raise IneligibleMembershipError,
          I18n.t('errors.membership.cannot_transfer_expired', default: 'Thẻ đã hết hạn, không thể chuyển nhượng.')
  end

  def validate_target_params!
    validate_target_presence!
    validate_not_self_transfer!
  end

  def validate_target_presence!
    if target_name.blank?
      raise InvalidTargetError,
            I18n.t('errors.membership.target_name_required', default: 'Vui lòng nhập tên người nhận.')
    end

    return if target_phone.present?

    raise InvalidTargetError,
          I18n.t('errors.membership.target_phone_required', default: 'Vui lòng nhập số điện thoại người nhận.')
  end

  def validate_not_self_transfer!
    source_digits = source.phone.to_s.gsub(/\D/, '')
    target_digits = target_phone.gsub(/\D/, '')
    return unless source_digits.present? && source_digits == target_digits

    raise InvalidTargetError,
          I18n.t('errors.membership.cannot_transfer_to_self', default: 'Không thể chuyển nhượng cho chính mình.')
  end

  def calculate_sessions_to_transfer
    source.package.session_based? ? source.sessions_left.to_i : nil
  end

  def calculate_days_to_transfer
    return nil unless source.package.day_based?

    [(source.expires_at - Date.current).to_i, 1].max
  end

  def find_or_create_target_membership!(sessions, days)
    existing = source.shop.memberships.kept
                     .where(phone: target_phone, package_id: source.package_id)
                     .where.not(status: %w[expired transferred])
                     .first

    if existing
      credit_existing_membership!(existing, sessions, days)
    else
      create_new_target_membership!(sessions, days)
    end
  end

  def credit_existing_membership!(existing, sessions, days)
    credit_balance!(existing, sessions, days)
    existing.transferred_from_membership = source
    existing.save!(validate: false)
    existing
  end

  def credit_balance!(existing, sessions, days)
    if source.package.session_based?
      existing.sessions_left = existing.sessions_left.to_i + sessions
    elsif days
      base_date = existing.expires_at && existing.expires_at >= Date.current ? existing.expires_at : Date.current
      existing.expires_at = base_date + days.days
    end
  end

  def create_new_target_membership!(sessions, days)
    new_expiry = days ? Date.current + days.days : nil
    Membership.create!(
      shop: source.shop,
      package: source.package,
      customer_name: target_name,
      phone: target_phone,
      sessions_left: sessions,
      expires_at: new_expiry,
      transferred_from_membership: source
    )
  end

  def create_transfer_invoice!(target)
    return nil if transfer_fee <= 0

    Invoice.create!(membership: target, amount: transfer_fee, status: 'paid')
  end

  def record_transfer!(target, invoice, sessions, days)
    MembershipTransfer.create!(
      shop: source.shop, source_membership: source, target_membership: target,
      staff: staff, invoice: invoice, sessions_transferred: sessions,
      days_transferred: days, fee: transfer_fee, note: note
    )
  end

  def finalize_source!(target)
    exhaust_source_balance!
    source.transferred_at = Time.current
    source.transferred_to_membership = target
    source.status = 'transferred'
    source.save!(validate: false)
  end

  def exhaust_source_balance!
    source.sessions_left = 0 if source.package.session_based?
    source.expires_at = Date.current if source.package.day_based?
  end

  def log_audit!(target, transfer)
    AuditLog.log_membership_transferred!(
      shop: source.shop,
      staff: staff,
      source_membership: source,
      target_membership: target,
      transfer: transfer
    )
  end
end
# rubocop:enable Metrics/ClassLength
