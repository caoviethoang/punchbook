# frozen_string_literal: true

# Service to process and send reminders to members whose memberships are expiring.
# Ensures deduplication by skipping memberships that have already been reminded today.
class SendMembershipRemindersService
  def self.call
    new.call
  end

  def call
    sent_reminders = []

    expiring_memberships.each do |membership|
      next if membership.reminder_sent_today?

      reminder = membership.membership_reminders.create!(
        sent_at: Time.current,
        reminder_type: 'expiring'
      )
      sent_reminders << reminder
    end

    sent_reminders
  end

  private

  def expiring_memberships
    Membership.includes(:package).find_each.select { |m| m.status == 'expiring' }
  end
end
