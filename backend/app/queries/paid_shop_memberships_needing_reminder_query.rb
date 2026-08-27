# frozen_string_literal: true

# Query object to find memberships belonging to paid shops that need reminders.
# Criteria:
# - Shop plan is 'paid'
# - sessions_left <= 3 OR expires_at is within the next 7 days
class PaidShopMembershipsNeedingReminderQuery
  def self.call(relation = Membership.all)
    new(relation).call
  end

  def initialize(relation = Membership.all)
    @relation = relation
  end

  def call
    @relation
      .joins(:shop)
      .merge(Shop.paid)
      .where(query_conditions, threshold: Membership::EXPIRING_SESSIONS_THRESHOLD, **date_range)
  end

  private

  def query_conditions
    '(memberships.sessions_left > 0 AND memberships.sessions_left <= :threshold) OR ' \
      '(memberships.expires_at >= :today AND memberships.expires_at <= :end_date)'
  end

  def date_range
    today = Date.current
    { today: today, end_date: today + Membership::EXPIRING_DAYS_WINDOW.days }
  end
end
