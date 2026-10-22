# frozen_string_literal: true

module MembershipStatusable
  extend ActiveSupport::Concern

  STATUSES = %w[active expiring expired].freeze
  EXPIRING_SESSIONS_THRESHOLD = 3
  EXPIRING_DAYS_WINDOW = 7

  included do
    before_validation :sync_status

    validates :status, presence: true, inclusion: { in: STATUSES }
  end

  module ClassMethods
    def by_status_query(status)
      case status
      when 'not_checked_in' then not_checked_in_status_query(Date.current)
      when 'expired', 'expiring', 'active' then where(status: status)
      else all
      end
    end

    def checked_in_today_subquery
      sanitize_sql_array(
        [
          'EXISTS (SELECT 1 FROM check_ins ' \
          'WHERE check_ins.membership_id = memberships.id ' \
          'AND check_ins.checked_in_at BETWEEN :start AND :end)',
          { start: Time.zone.now.beginning_of_day, end: Time.zone.now.end_of_day }
        ]
      )
    end

    private

    def not_checked_in_status_query(today)
      joins(:package).where(
        "NOT (#{checked_in_today_subquery}) AND (" \
        '(packages.sessions_count IS NOT NULL AND memberships.sessions_left > 0) OR ' \
        '(packages.duration_days IS NOT NULL AND ' \
        '(memberships.expires_at IS NULL OR memberships.expires_at >= :today))' \
        ')',
        today: today
      )
    end

    def expired_status_query(today)
      joins(:package).where(
        '(packages.sessions_count IS NOT NULL AND memberships.sessions_left <= 0) OR ' \
        '(packages.duration_days IS NOT NULL AND ' \
        '(memberships.expires_at IS NULL OR memberships.expires_at < :today))',
        today: today
      )
    end

    def expiring_status_query(today, expiring_date)
      joins(:package).where(
        '(packages.sessions_count IS NOT NULL AND memberships.sessions_left > 0 AND ' \
        'memberships.sessions_left <= :threshold) OR ' \
        '(packages.duration_days IS NOT NULL AND memberships.expires_at IS NOT NULL AND ' \
        'memberships.expires_at >= :today AND memberships.expires_at <= :expiring_date)',
        threshold: EXPIRING_SESSIONS_THRESHOLD, today: today, expiring_date: expiring_date
      )
    end

    def active_status_query(expiring_date)
      joins(:package).where(
        '(packages.sessions_count IS NOT NULL AND memberships.sessions_left > :threshold) OR ' \
        '(packages.duration_days IS NOT NULL AND memberships.expires_at IS NOT NULL AND ' \
        'memberships.expires_at > :expiring_date)',
        threshold: EXPIRING_SESSIONS_THRESHOLD, expiring_date: expiring_date
      )
    end
  end

  def status
    if new_record? || sessions_left_changed? || expires_at_changed?
      calculate_status
    else
      read_attribute(:status).presence || calculate_status
    end
  end

  def calculate_status
    return 'expired' if status_expired?
    return 'expiring' if status_expiring?

    'active'
  end

  def sync_status
    self.status = calculate_status if package.present?
  end

  def expired?
    expires_at.present? && expires_at < Date.current
  end

  def no_sessions_left?
    package.session_based? && sessions_left.to_i <= 0
  end

  def reminder_sent_today?
    today_range = Time.current.all_day
    if membership_reminders.loaded?
      membership_reminders.any? { |r| r.sent_at && today_range.cover?(r.sent_at) }
    else
      membership_reminders.exists?(sent_at: today_range)
    end
  end

  def apply_package_init
    if package.session_based?
      self.sessions_left = package.sessions_count
    else
      self.expires_at = Date.current + package.duration_days
    end
  end

  def renew!
    if package.session_based?
      self.sessions_left = sessions_left.to_i + package.sessions_count.to_i
    elsif package.day_based?
      self.expires_at = calculate_renewal_expires_at
    end
    save!
  end

  private

  def calculate_renewal_expires_at
    base_date = expires_at.present? && expires_at >= Date.current ? expires_at : Date.current
    base_date + package.duration_days.days
  end

  def status_expired?
    return false unless package

    if package.session_based?
      sessions_left.to_i <= 0
    else
      expires_at.blank? || expires_at < Date.current
    end
  end

  def status_expiring?
    return false unless package

    if package.session_based?
      sessions_left.to_i <= EXPIRING_SESSIONS_THRESHOLD
    else
      expires_at.present? &&
        expires_at >= Date.current &&
        expires_at <= Date.current + EXPIRING_DAYS_WINDOW.days
    end
  end
end
