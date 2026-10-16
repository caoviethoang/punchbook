# frozen_string_literal: true

# Service to process and send reminders to members whose memberships are expiring.
# Delegates individual reminder processing to SendSingleMembershipReminderService.
class SendMembershipRemindersService
  def self.call
    new.call
  end

  def call
    expiring_memberships.each_with_object([]) do |membership, sent_reminders|
      reminder = SendSingleMembershipReminderService.call(membership)
      sent_reminders << reminder if reminder
    end
  end

  private

  def expiring_memberships
    Membership.needing_reminder.includes(:package, :shop, :membership_reminders, :invoices)
  end
end
