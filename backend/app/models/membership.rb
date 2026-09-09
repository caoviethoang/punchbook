# frozen_string_literal: true

# rubocop:disable Metrics/ClassLength, Metrics/BlockLength
class Membership < ApplicationRecord
  include Discard::Model

  default_scope { kept }

  STATUSES = %w[active expiring expired].freeze
  EXPIRING_SESSIONS_THRESHOLD = 3
  EXPIRING_DAYS_WINDOW = 7

  MAX_FREE_MEMBERSHIPS = 15

  belongs_to :shop
  belongs_to :package, -> { with_discarded }, inverse_of: :memberships
  has_many :check_ins, dependent: :destroy
  has_many :invoices, dependent: :destroy
  has_many :membership_reminders, dependent: :destroy

  validates :customer_name, :phone, presence: true
  validates :sessions_left, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validate :validate_free_plan_limit, on: :create

  scope :search_by_query, lambda { |query|
    return all if query.blank?

    raw_query = query.to_s.strip
    name_pattern = "%#{sanitize_sql_like(raw_query)}%"
    digits_only = raw_query.gsub(/\D/, '')

    if digits_only.present?
      phone_pattern = "%#{sanitize_sql_like(digits_only)}%"
      sql = 'memberships.customer_name ILIKE :q OR memberships.phone ILIKE :q OR ' \
            "regexp_replace(memberships.phone, '\\D', '', 'g') ILIKE :pq"
      where(sql, q: name_pattern, pq: phone_pattern)
    else
      where('memberships.customer_name ILIKE :q OR memberships.phone ILIKE :q', q: name_pattern)
    end
  }
  scope :needing_reminder, -> { PaidShopMembershipsNeedingReminderQuery.call(self) }

  scope :by_status, lambda { |status|
    return all if status.blank? || status.to_s == 'all'

    today = Date.current
    expiring_date = today + EXPIRING_DAYS_WINDOW.days

    case status.to_s
    when 'expired'
      joins(:package).where(
        '(packages.sessions_count IS NOT NULL AND memberships.sessions_left <= 0) OR ' \
        '(packages.duration_days IS NOT NULL AND (memberships.expires_at IS NULL OR memberships.expires_at < :today))',
        today: today
      )
    when 'expiring'
      joins(:package).where(
        '(packages.sessions_count IS NOT NULL AND memberships.sessions_left > 0 AND ' \
        'memberships.sessions_left <= :threshold) OR ' \
        '(packages.duration_days IS NOT NULL AND memberships.expires_at IS NOT NULL AND ' \
        'memberships.expires_at >= :today AND memberships.expires_at <= :expiring_date)',
        threshold: EXPIRING_SESSIONS_THRESHOLD, today: today, expiring_date: expiring_date
      )
    when 'active'
      joins(:package).where(
        '(packages.sessions_count IS NOT NULL AND memberships.sessions_left > :threshold) OR ' \
        '(packages.duration_days IS NOT NULL AND memberships.expires_at IS NOT NULL AND ' \
        'memberships.expires_at > :expiring_date)',
        threshold: EXPIRING_SESSIONS_THRESHOLD, expiring_date: expiring_date
      )
    else
      all
    end
  }

  def expired?
    expires_at.present? && expires_at < Date.current
  end

  def no_sessions_left?
    package.session_based? && sessions_left.to_i <= 0
  end

  def reminder_sent_today?
    membership_reminders.exists?(sent_at: Time.current.all_day)
  end

  # Single source of truth for dashboard + member tables.
  #
  # Rules (package-type scoped):
  # - expired:  session → sessions_left == 0
  #             day     → expires_at blank or expires_at < today
  # - expiring: session → sessions_left <= 3 (and not expired)
  #             day     → expires_at within today..today+7 days
  # - active:   everything else
  def status
    return 'expired' if status_expired?
    return 'expiring' if status_expiring?

    'active'
  end

  def as_api_json
    MembershipSerializer.new(self).as_api_json
  end

  def as_dashboard_json
    MembershipSerializer.new(self).as_dashboard_json
  end

  def as_detail_json
    MembershipSerializer.new(self).as_detail_json
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

  def validate_free_plan_limit
    return unless shop&.plan == 'free'
    return if shop.memberships.count < MAX_FREE_MEMBERSHIPS

    errors.add(:base, 'Gói Free chỉ được tạo tối đa 15 hội viên. Vui lòng nâng cấp gói trả phí để tạo thêm hội viên.')
  end
end
# rubocop:enable Metrics/ClassLength, Metrics/BlockLength
