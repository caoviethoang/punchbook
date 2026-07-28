# frozen_string_literal: true

class CheckInMembership
  class Error < StandardError; end
  class InsufficientSessionsError < Error; end
  class MembershipExpiredError < Error; end

  def self.call(membership:, staff:)
    new(membership: membership, staff: staff).call
  end

  def initialize(membership:, staff:)
    @membership = membership
    @staff = staff
  end

  def call
    membership.with_lock do
      if session_based?
        check_in_session_based!
      else
        check_in_day_based!
      end
    end
  end

  private

  attr_reader :membership, :staff

  # sessions_count present => gói theo buổi; null => gói theo ngày
  def session_based?
    membership.package.sessions_count.present?
  end

  def check_in_session_based!
    raise InsufficientSessionsError, 'Hội viên đã hết buổi' if membership.sessions_left.to_i <= 0

    membership.update!(sessions_left: membership.sessions_left - 1)
    create_check_in!
  end

  def check_in_day_based!
    if membership.expires_at.blank? || membership.expires_at < Date.current
      raise MembershipExpiredError, 'Hội viên đã hết hạn'
    end

    create_check_in!
  end

  def create_check_in!
    CheckIn.create!(
      membership: membership,
      staff: staff,
      checked_in_at: Time.current
    )
  end
end
