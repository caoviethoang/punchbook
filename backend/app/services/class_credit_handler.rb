# frozen_string_literal: true

class ClassCreditHandler
  class << self
    def deduct!(booking, schedule)
      return unless schedule.credit_policy == 'booking' && booking.membership.package.session_based?
      return if booking.credit_deducted?

      booking.membership.update!(sessions_left: booking.membership.sessions_left - 1)
      booking.credit_deducted = true
    end

    def refund_if_needed!(booking)
      return unless booking.credit_deducted? && booking.membership.sessions_left.present?

      booking.membership.update!(sessions_left: booking.membership.sessions_left + 1)
      booking.credit_deducted = false
    end
  end
end
