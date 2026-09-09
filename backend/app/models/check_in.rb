# frozen_string_literal: true

class CheckIn < ApplicationRecord
  belongs_to :membership, inverse_of: :check_ins
  belongs_to :staff, inverse_of: :check_ins

  validates :checked_in_at, presence: true
end
