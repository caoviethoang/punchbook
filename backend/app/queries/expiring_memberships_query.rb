# frozen_string_literal: true

# Finds memberships that are expiring within `days` (default 3)
# or have <= `sessions` (default 3) sessions remaining.
class ExpiringMembershipsQuery
  DEFAULT_DAYS_THRESHOLD = 3
  DEFAULT_SESSIONS_THRESHOLD = 3

  def self.call(relation = Membership.all, days: DEFAULT_DAYS_THRESHOLD, sessions: DEFAULT_SESSIONS_THRESHOLD)
    new(relation, days: days, sessions: sessions).call
  end

  def initialize(relation = Membership.all, days: DEFAULT_DAYS_THRESHOLD, sessions: DEFAULT_SESSIONS_THRESHOLD)
    @relation = relation
    @days = days
    @sessions = sessions
  end

  def call
    today = Date.current
    end_date = today + days.days

    relation.joins(:package).where(
      query_conditions,
      threshold: sessions, today: today, end_date: end_date
    )
  end

  private

  attr_reader :relation, :days, :sessions

  def query_conditions
    '(packages.sessions_count IS NOT NULL AND memberships.sessions_left > 0 AND ' \
      'memberships.sessions_left <= :threshold) OR ' \
      '(packages.duration_days IS NOT NULL AND memberships.expires_at IS NOT NULL AND ' \
      'memberships.expires_at >= :today AND memberships.expires_at <= :end_date)'
  end
end
