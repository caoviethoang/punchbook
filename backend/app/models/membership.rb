# frozen_string_literal: true

class Membership < ApplicationRecord
  STATUSES = %w[active expiring expired].freeze
  EXPIRING_SESSIONS_THRESHOLD = 3
  EXPIRING_DAYS_WINDOW = 7

  MAX_FREE_MEMBERSHIPS = 15

  belongs_to :shop
  belongs_to :package
  has_many :check_ins, dependent: :destroy
  has_many :invoices, dependent: :destroy

  validates :customer_name, :phone, presence: true
  validates :sessions_left, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validate :validate_free_plan_limit, on: :create

  scope :search_by_query, lambda { |query|
    return all if query.blank?

    pattern = "%#{sanitize_sql_like(query.to_s.strip)}%"
    where('memberships.customer_name ILIKE :q OR memberships.phone ILIKE :q', q: pattern)
  }

  def expired?
    expires_at.present? && expires_at < Date.current
  end

  def no_sessions_left?
    package.session_based? && sessions_left.to_i <= 0
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

  def apply_package_init
    if package.session_based?
      self.sessions_left = package.sessions_count
    else
      self.expires_at = Date.current + package.duration_days
    end
  end

  private

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
