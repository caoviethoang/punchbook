# frozen_string_literal: true

class Membership < ApplicationRecord
  belongs_to :shop
  belongs_to :package
  has_many :check_ins, dependent: :destroy
  has_many :invoices, dependent: :destroy

  validates :customer_name, :phone, presence: true
  validates :sessions_left, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

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

  # Dashboard status: expired | expiring | active (see issue #27 rules).
  def status
    return 'expired' if status_expired?
    return 'expiring' if status_expiring?

    'active'
  end

  def as_api_json
    as_json(
      only: %i[id customer_name phone sessions_left expires_at],
      include: { package: { only: %i[id name] } }
    )
  end

  def as_dashboard_json
    as_api_json.merge('status' => status)
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
      sessions_left.to_i <= 3
    else
      expires_at.present? && expires_at <= Date.current + 7.days
    end
  end
end
