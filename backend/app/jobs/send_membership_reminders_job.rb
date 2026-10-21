# frozen_string_literal: true

# Scheduled job acting as an enqueuer: queries memberships needing reminder
# and fans out individual SendSingleMembershipReminderJob workers.
class SendMembershipRemindersJob < ApplicationJob
  queue_as :default

  def perform
    membership_ids = Membership.needing_reminder.pluck(:id)
    membership_ids.each do |membership_id|
      SendSingleMembershipReminderJob.perform_later(membership_id)
    end
    membership_ids
  end
end
