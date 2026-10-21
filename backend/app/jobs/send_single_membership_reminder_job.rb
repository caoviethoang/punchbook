# frozen_string_literal: true

# Background job to send a reminder for a single membership.
# Ensures idempotency and isolated retry on network failures.
class SendSingleMembershipReminderJob < ApplicationJob
  queue_as :default

  def perform(membership_id)
    membership = Membership.includes(:package, :shop, :membership_reminders, :invoices).find_by(id: membership_id)
    return unless membership
    return if membership.reminder_sent_today?

    SendSingleMembershipReminderService.call(membership)
  end
end
