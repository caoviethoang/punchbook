# frozen_string_literal: true

# Counts completed hold days per calendar year, including session-based holds.
class MembershipFreezeAllowance
  def initialize(membership)
    @membership = membership
  end

  def available?(starts_on:, ends_on:)
    limit = @membership.shop.max_freeze_days_per_year || 30
    (starts_on.year..(ends_on - 1).year).all? do |year|
      used = completed_intervals.sum { |start_date, end_date| days_in_year(start_date, end_date, year) }
      used + days_in_year(starts_on, ends_on, year) <= limit
    end
  end

  private

  def completed_intervals
    @completed_intervals ||= @membership.shop.audit_logs
                                        .where(target_type: 'Membership', target_id: @membership.id,
                                               action: 'membership_unfrozen').map do |log|
      details = log.details
      # Older audit entries only recorded the duration and completion time.
      end_date = details['freeze_ended_on']&.to_date || log.created_at.to_date
      start_date = details['freeze_started_on']&.to_date || (end_date - details['days_extended'].to_i)
      [start_date, end_date]
    end
  end

  def days_in_year(start_date, end_date, year)
    first = [start_date, Date.new(year, 1, 1)].max
    last = [end_date, Date.new(year + 1, 1, 1)].min
    [(last - first).to_i, 0].max
  end
end
