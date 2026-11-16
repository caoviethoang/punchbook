# frozen_string_literal: true

# Daily job to scan for members celebrating birthdays and send birthday greetings
# via configured multi-channel notifications (Zalo / SMS / Email).
class SendBirthdayWishesJob < ApplicationJob
  queue_as :default

  def perform(target_date = Time.zone.today)
    date = target_date.is_a?(String) ? Date.parse(target_date) : target_date
    eligible_memberships = Membership.kept.birthday_today(date).includes(:shop, :package)
    sent_count = 0

    eligible_memberships.find_each do |membership|
      next if already_sent_today?(membership, date)

      SendNotificationJob.perform_later(:birthday_wish, shop_id: membership.shop_id, membership_id: membership.id)
      sent_count += 1
    end

    sent_count
  end

  private

  def already_sent_today?(membership, date)
    NotificationLog.exists?(
      membership_id: membership.id,
      event_type: 'birthday_wish',
      created_at: date.all_day
    )
  end
end
