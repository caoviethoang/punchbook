# frozen_string_literal: true

class ClassBookingEligibility
  class << self
    def validate!(membership, schedule, prepaid: false)
      check_membership_valid!(membership, schedule)
      check_freeze_state!(membership)
      check_credits_or_validity!(membership, schedule, prepaid: prepaid)
    end

    def fail_with(key)
      raise ClassBookingService::Error, I18n.t("classes.errors.#{key}")
    end

    private

    def check_membership_valid!(membership, schedule)
      fail_with(:invalid_member) if membership.discarded? || membership.shop_id != schedule.shop_id
    end

    def check_freeze_state!(membership)
      fail_with(:frozen_member) if membership.has_attribute?(:frozen_at) && membership[:frozen_at].present?
    end

    def check_credits_or_validity!(membership, schedule, prepaid:)
      if membership.package.session_based?
        fail_with(:no_credit) if !prepaid && membership.sessions_left.to_i <= 0
      elsif membership.expires_at.blank? || membership.expires_at < schedule.starts_at.in_time_zone.to_date
        fail_with(:expired_member)
      end
    end
  end
end
