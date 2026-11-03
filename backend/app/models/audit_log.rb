# frozen_string_literal: true

class AuditLog < ApplicationRecord
  belongs_to :shop
  belongs_to :staff, optional: true

  validates :action, presence: true

  scope :by_action, ->(action) { where(action: action) }
  scope :by_staff, ->(staff_id) { where(staff_id: staff_id) }
  scope :recent, -> { order(created_at: :desc).limit(50) }

  def self.log_check_in!(shop:, staff:, membership:, checked_in_at:, **extra)
    details = {
      membership_name: membership.customer_name, package_name: membership.package.name,
      sessions_after: membership.sessions_left, checked_in_at: checked_in_at.iso8601,
      **extra
    }
    create!(shop: shop, staff: staff, action: 'check_in', target_type: 'Membership', target_id: membership.id,
            details: details)
  end

  def self.log_membership_created!(shop:, staff:, membership:, **extra)
    details = {
      customer_name: membership.customer_name, phone: membership.phone, package_name: membership.package.name,
      sessions_left: membership.sessions_left, expires_at: membership.expires_at&.iso8601, **extra
    }
    create!(shop: shop, staff: staff, action: 'membership_created', target_type: 'Membership',
            target_id: membership.id, details: details)
  end

  def self.log_membership_renewed!(shop:, staff:, membership:, **extra)
    details = {
      customer_name: membership.customer_name, sessions_before: extra[:sessions_before],
      sessions_after: membership.sessions_left, expires_at_before: extra[:expires_at_before],
      expires_at_after: membership.expires_at&.iso8601, **extra.except(:sessions_before, :expires_at_before)
    }
    create!(shop: shop, staff: staff, action: 'membership_renewed', target_type: 'Membership',
            target_id: membership.id, details: details)
  end

  def self.log_membership_renewal_needed!(shop:, membership:)
    reason = format_renewal_reason(membership)
    details = {
      customer_name: membership.customer_name, phone: membership.phone,
      package_name: membership.package.name, sessions_left: membership.sessions_left,
      expires_at: membership.expires_at&.iso8601, reason: reason
    }
    create!(
      shop: shop, staff: nil, action: 'membership_renewal_needed',
      target_type: 'Membership', target_id: membership.id, details: details
    )
  end

  # rubocop:disable Metrics/ParameterLists, Metrics/MethodLength
  def self.log_membership_frozen!(shop:, staff:, membership:, frozen_until:, reason: nil, **extra)
    details = {
      customer_name: membership.customer_name,
      phone: membership.phone,
      package_name: membership.package&.name,
      frozen_until: frozen_until.to_s,
      reason: reason,
      **extra
    }
    create!(
      shop: shop,
      staff: staff,
      action: 'membership_frozen',
      target_type: 'Membership',
      target_id: membership.id,
      details: details
    )
  end

  def self.log_membership_unfrozen!(shop:, staff:, membership:, days_extended:, new_expires_at:, reason: nil, **extra)
    details = {
      customer_name: membership.customer_name,
      phone: membership.phone,
      package_name: membership.package&.name,
      days_extended: days_extended,
      new_expires_at: new_expires_at&.iso8601,
      reason: reason,
      **extra
    }
    create!(
      shop: shop,
      staff: staff,
      action: 'membership_unfrozen',
      target_type: 'Membership',
      target_id: membership.id,
      details: details
    )
  end
  # rubocop:enable Metrics/ParameterLists, Metrics/MethodLength

  def self.format_renewal_reason(membership)
    if membership.package.session_based?
      "Còn #{membership.sessions_left} buổi"
    else
      days_left = (membership.expires_at - Date.current).to_i
      date_str = membership.expires_at.strftime('%d/%m/%Y')
      days_left <= 0 ? 'Hết hạn hôm nay' : "Còn #{days_left} ngày (hết hạn #{date_str})"
    end
  end
end
