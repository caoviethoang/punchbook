# frozen_string_literal: true

class MembershipReminder < ApplicationRecord
  belongs_to :membership

  validates :sent_at, :reminder_type, presence: true
end
