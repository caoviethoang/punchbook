# frozen_string_literal: true

class KioskCheckInService
  UUID_REGEX = /\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i

  def self.call(shop:, identifier:)
    new(shop: shop, identifier: identifier).call
  end

  def initialize(shop:, identifier:)
    @shop = shop
    @identifier = identifier.to_s.strip
  end

  def call
    return error_result('IDENTIFIER_MISSING', 'Vui lòng nhập số điện thoại hoặc quẹt thẻ') if identifier.blank?

    membership = find_membership
    return not_found_result if membership.blank?

    execute_kiosk_check_in(membership)
  end

  private

  attr_reader :shop, :identifier

  def find_membership
    clean_id = identifier.sub(/\APUNCHBOOK:/i, '')
    find_by_card(identifier, clean_id) ||
      find_by_id(clean_id) ||
      find_by_public_token(clean_id) ||
      find_by_phone(identifier)
  end

  def find_by_card(raw, clean)
    shop.memberships.find_by(card_number: raw) || shop.memberships.find_by(card_number: clean)
  end

  def find_by_id(clean_id)
    shop.memberships.find_by(id: clean_id) if clean_id.match?(UUID_REGEX)
  end

  def find_by_public_token(token)
    shop.memberships.find_by(public_token: token) if token.present?
  end

  def find_by_phone(raw)
    digits = raw.gsub(/\D/, '')
    return nil if digits.blank?

    shop.memberships.where("regexp_replace(phone, '\\D', '', 'g') = ?", digits).first
  end

  # rubocop:disable Metrics/MethodLength
  def execute_kiosk_check_in(membership)
    check_in = CheckInMembership.call(
      membership: membership,
      staff: kiosk_staff,
      extra_audit_details: { source: 'kiosk', identifier_used: identifier }
    )
    build_success_result(membership.reload, check_in)
  rescue CheckInMembership::InsufficientSessionsError => e
    build_denied_result(membership, 'NO_SESSIONS_LEFT', e.message, with_renewal: true)
  rescue CheckInMembership::MembershipExpiredError => e
    build_denied_result(membership, 'MEMBERSHIP_EXPIRED', e.message, with_renewal: true)
  rescue CheckInMembership::MembershipFrozenError => e
    build_denied_result(membership, 'MEMBERSHIP_FROZEN', e.message, with_renewal: false)
  rescue CheckInMembership::MembershipTransferredError => e
    build_denied_result(membership, 'MEMBERSHIP_TRANSFERRED', e.message, with_renewal: false)
  end
  # rubocop:enable Metrics/MethodLength

  def kiosk_staff
    shop.staffs.find_by(role: 'admin') || shop.staffs.first
  end

  def build_success_result(membership, check_in)
    milestone = membership.check_in_milestone_reached
    KioskCheckInResult.new(
      status: :success,
      message: 'Check-in thành công!',
      audio_text: success_audio_text(membership, milestone),
      membership: membership,
      check_in: check_in,
      milestone_reached: milestone
    )
  end

  def success_audio_text(membership, milestone)
    if milestone.present?
      "Chúc mừng #{membership.customer_name} đạt cột mốc #{milestone} lần check-in! Mời bạn vào tập."
    else
      "Xin chào #{membership.customer_name}! Mời bạn vào tập."
    end
  end

  def build_denied_result(membership, code, message, with_renewal: false)
    renewal = with_renewal ? KioskRenewalBuilder.call(shop: shop, membership: membership) : nil
    suffix = with_renewal ? ' Vui lòng quét mã QR để gia hạn ngay.' : ''

    KioskCheckInResult.new(
      status: :denied,
      code: code,
      message: message,
      audio_text: "#{message}.#{suffix}".strip,
      membership: membership,
      renewal: renewal
    )
  end

  def error_result(code, message)
    KioskCheckInResult.new(status: :denied, code: code, message: message, audio_text: message)
  end

  def not_found_result
    error_result('MEMBERSHIP_NOT_FOUND', 'Không tìm thấy thông tin hội viên. Vui lòng liên hệ quầy lễ tân.')
  end
end
