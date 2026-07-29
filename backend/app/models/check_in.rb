# frozen_string_literal: true

class CheckIn < ApplicationRecord
  belongs_to :membership
  belongs_to :staff

  validates :checked_in_at, presence: true
end
