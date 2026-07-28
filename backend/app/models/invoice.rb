# frozen_string_literal: true

class Invoice < ApplicationRecord
  STATUSES = %w[pending paid failed cancelled].freeze

  belongs_to :membership

  validates :status, presence: true, inclusion: { in: STATUSES }
end
