# frozen_string_literal: true

module MembershipStatusable
  extend ActiveSupport::Concern

  STATUSES = %w[active expiring expired].freeze
  EXPIRING_SESSIONS_THRESHOLD = 3
  EXPIRING_DAYS_WINDOW = 7

  module ClassMethods
    def by_status_query(status)
      today = Date.current
      expiring_date = today + EXPIRING_DAYS_WINDOW.days

      case status
      when 'expired' then expired_status_query(today)
      when 'expiring' then expiring_status_query(today, expiring_date)
      when 'active' then active_status_query(expiring_date)
      else all
      end
    end

    private

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
    return 'expired' if status_expired?
    return 'expiring' if status_expiring?

    'active'
  end

  def expired?
    expires_at.present? && expires_at < Date.current
  end

  def no_sessions_left?
    package.session_based? && sessions_left.to_i <= 0
  end

  def reminder_sent_today?
    membership_reminders.exists?(sent_at: Time.current.all_day)
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
    if package.session_based?
      sessions_left.to_i <= 0
    else
      expires_at.blank? || expires_at < Date.current
    end
  end

  def status_expiring?
    if package.session_based?
      sessions_left.to_i <= EXPIRING_SESSIONS_THRESHOLD
    else
      expires_at.present? &&
        expires_at >= Date.current &&
        expires_at <= Date.current + EXPIRING_DAYS_WINDOW.days
    end
  end
end
