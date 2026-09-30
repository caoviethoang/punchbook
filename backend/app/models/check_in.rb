# frozen_string_literal: true

class CheckIn < ApplicationRecord
  belongs_to :membership, -> { with_discarded }, inverse_of: :check_ins
  belongs_to :staff, inverse_of: :check_ins

  has_paper_trail

  validates :checked_in_at, presence: true
end
