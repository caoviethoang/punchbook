# frozen_string_literal: true

# Daily service to update membership statuses and log renewal warnings for admin.
class UpdateDailyMembershipStatuses
  RENEWAL_WARNING_DAYS = 3
  RENEWAL_WARNING_SESSIONS = 3

  def self.call
    new.call
  end

  def call
    updated_count = update_all_membership_statuses
    alerted_count = process_expiring_membership_alerts

    Rails.logger.info(
      "[DailyMembershipStatus] Completed: updated #{updated_count} membership statuses, " \
      "logged #{alerted_count} renewal warnings."
    )

    { updated_count: updated_count, alerted_count: alerted_count }
  end

  private

  def update_all_membership_statuses
    count = 0
    Membership.kept.includes(:package).find_each do |membership|
      new_status = membership.calculate_status
      if membership.status != new_status
        membership.update!(status: new_status)
        count += 1
      end
    end
    count
  end

  def process_expiring_membership_alerts
    logged_count = 0
    expiring_memberships_scope.find_each do |membership|
      next if already_logged_today?(membership)

      AuditLog.log_membership_renewal_needed!(shop: membership.shop, membership: membership)
      logged_count += 1
    end
    logged_count
  end

  def expiring_memberships_scope
    ExpiringMembershipsQuery.call(
      Membership.kept.includes(:shop, :package),
      days: RENEWAL_WARNING_DAYS,
      sessions: RENEWAL_WARNING_SESSIONS
    )
  end

  def already_logged_today?(membership)
    AuditLog.exists?(
      shop_id: membership.shop_id,
      action: 'membership_renewal_needed',
      target_type: 'Membership',
      target_id: membership.id,
      created_at: Time.zone.now.all_day
    )
  end
end
