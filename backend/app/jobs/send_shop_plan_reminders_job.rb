# frozen_string_literal: true

# Daily job to trigger Zalo expiration reminders for shops nearing plan end date.
class SendShopPlanRemindersJob
  include Sidekiq::Job

  def perform
    SendShopPlanRemindersService.call
  end
end
