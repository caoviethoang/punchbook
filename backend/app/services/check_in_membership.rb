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

  def session_based?
    membership.package.session_based?
  end

  def check_in_session_based!
    raise InsufficientSessionsError, 'Membership has no sessions left' if membership.sessions_left.to_i <= 0

    membership.update!(sessions_left: membership.sessions_left - 1)
    create_check_in!
  end

  def check_in_day_based!
    if membership.expires_at.blank? || membership.expires_at < Date.current
      raise MembershipExpiredError, 'Membership has expired'
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
