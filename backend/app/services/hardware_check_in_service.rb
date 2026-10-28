# frozen_string_literal: true

class HardwareCheckInService
  class Error < StandardError
    attr_reader :code, :membership

    def initialize(message, code: 'HARDWARE_CHECK_IN_ERROR', membership: nil)
      super(message)
      @code = code
      @membership = membership
    end
  end

  UUID_REGEX = /\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i

  def self.call(shop:, identifier:, device_name: nil)
    new(shop: shop, identifier: identifier, device_name: device_name).call
  end

  def initialize(shop:, identifier:, device_name: nil)
    @shop = shop
    @identifier = identifier.to_s.strip
    @device_name = device_name.presence || 'Hardware Terminal'
  end

  def call
    raise Error.new('Vui lòng cung cấp mã định danh hội viên', code: 'IDENTIFIER_MISSING') if identifier.blank?

    membership = find_membership!
    execute_check_in!(membership)
  end

  private

  attr_reader :shop, :identifier, :device_name

  def find_membership!
    clean_id = identifier.sub(/\APUNCHBOOK:/i, '')
    member = find_by_card(identifier, clean_id) || find_by_id(clean_id) || find_by_phone(identifier)
    return member if member.present?

    raise Error.new('Không tìm thấy hội viên phù hợp', code: 'MEMBERSHIP_NOT_FOUND')
  end

  def find_by_card(raw, clean)
    shop.memberships.find_by(card_number: raw) || shop.memberships.find_by(card_number: clean)
  end

  def find_by_id(clean_id)
    shop.memberships.find_by(id: clean_id) if clean_id.match?(UUID_REGEX)
  end

  def find_by_phone(raw)
    digits = raw.gsub(/\D/, '')
    return nil if digits.blank?

    shop.memberships.where("regexp_replace(phone, '\\D', '', 'g') = ?", digits).first
  end

  def execute_check_in!(membership)
    check_in = CheckInMembership.call(
      membership: membership,
      staff: staff_for_check_in,
      extra_audit_details: audit_details
    )

    build_check_in_result(check_in, membership)
  rescue CheckInMembership::InsufficientSessionsError => e
    raise Error.new(e.message, code: 'NO_SESSIONS_LEFT', membership: membership)
  rescue CheckInMembership::MembershipExpiredError => e
    raise Error.new(e.message, code: 'MEMBERSHIP_EXPIRED', membership: membership)
  end

  def staff_for_check_in
    shop.staffs.find_by(role: 'admin') || shop.staffs.first
  end

  def audit_details
    { source: 'hardware_device', device_name: device_name, identifier_used: identifier }
  end

  def build_check_in_result(check_in, membership)
    {
      check_in: check_in,
      membership: membership.reload,
      device_name: device_name,
      message: success_message(membership)
    }
  end

  def success_message(membership)
    if membership.package.session_based?
      "Check-in thành công. Còn lại #{membership.sessions_left} buổi."
    else
      "Check-in thành công. Hạn sử dụng đến #{membership.expires_at&.strftime('%d/%m/%Y')}."
    end
  end
end
