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
      validate_eligibility!
      process_check_in!
    end
  end

  private

  attr_reader :membership, :staff

  def validate_eligibility!
    if membership.package.session_based?
      raise InsufficientSessionsError, 'Membership has no sessions left' if membership.no_sessions_left?
    elsif membership.expired? || membership.expires_at.blank?
      raise MembershipExpiredError, 'Membership has expired'
    end
  end

  def process_check_in!
    membership.update!(sessions_left: membership.sessions_left - 1) if membership.package.session_based?

    CheckIn.create!(
      membership: membership,
      staff: staff,
      checked_in_at: Time.current
    )
  end
end
