# frozen_string_literal: true

# Recurring Sidekiq job that runs daily at 8:00 AM.
# Scans and updates membership statuses and logs renewal alerts for admin.
class DailyMembershipStatusUpdateJob < ApplicationJob
  queue_as :default

  def perform
    UpdateDailyMembershipStatuses.call
  end
end
