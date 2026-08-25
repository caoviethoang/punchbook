# frozen_string_literal: true

class SendMembershipRemindersJob < ApplicationJob
  queue_as :default

  def perform
    SendMembershipRemindersService.call
  end
end
