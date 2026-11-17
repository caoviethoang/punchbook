# frozen_string_literal: true

module MembershipMilestoneable
  extend ActiveSupport::Concern

  CHECK_IN_MILESTONES = [10, 25, 50, 100, 200, 250, 500, 1000].freeze

  included do
    scope :birthday_today, lambda { |date = Time.zone.today|
      where('EXTRACT(MONTH FROM date_of_birth) = ? AND EXTRACT(DAY FROM date_of_birth) = ?', date.month, date.day)
    }
  end

  def birthday_today?(date = Time.zone.today)
    return false if date_of_birth.blank?

    date_of_birth.month == date.month && date_of_birth.day == date.day
  end

  def check_in_milestone_reached(count = total_check_ins_count)
    return count if CHECK_IN_MILESTONES.include?(count)

    nil
  end
end
