# frozen_string_literal: true

class Invoice < ApplicationRecord
  STATUSES = %w[pending paid failed cancelled].freeze

  belongs_to :membership

  validates :amount, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :status, presence: true, inclusion: { in: STATUSES }

  def as_api_json
    InvoiceSerializer.new(self).as_api_json
  end
end
