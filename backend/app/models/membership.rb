# frozen_string_literal: true

class Membership < ApplicationRecord
  include MembershipStatusable

  MAX_FREE_MEMBERSHIPS = 15

  belongs_to :shop, inverse_of: :memberships
  belongs_to :package, inverse_of: :memberships
  has_many :check_ins, dependent: :destroy, inverse_of: :membership
  has_many :invoices, dependent: :destroy, inverse_of: :membership
  has_many :membership_reminders, dependent: :destroy, inverse_of: :membership

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

    by_status_query(status.to_s)
  }

  def as_api_json
    MembershipSerializer.new(self).as_api_json
  end

  def as_dashboard_json
    MembershipSerializer.new(self).as_dashboard_json
  end

  def as_detail_json
    MembershipSerializer.new(self).as_detail_json
  end

  private

  def validate_free_plan_limit
    return unless shop&.plan == 'free'
    return if shop.memberships.count < MAX_FREE_MEMBERSHIPS

    errors.add(:base, 'Gói Free chỉ được tạo tối đa 15 hội viên. Vui lòng nâng cấp gói trả phí để tạo thêm hội viên.')
  end
end
