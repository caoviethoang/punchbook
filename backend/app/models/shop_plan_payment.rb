# frozen_string_literal: true

class ShopPlanPayment < ApplicationRecord
  STATUSES = %w[pending paid failed cancelled].freeze

  belongs_to :shop, inverse_of: :shop_plan_payments

  before_validation :generate_payos_order_code, on: :create

  validates :amount, :months, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :payos_order_code, presence: true, uniqueness: true

  private

  def generate_payos_order_code
    return if payos_order_code.present?

    loop do
      candidate = (Time.current.strftime('%m%d%H%M%S').to_i * 100) + rand(10..99)
      unless ShopPlanPayment.exists?(payos_order_code: candidate) || Invoice.exists?(payos_order_code: candidate)
        self.payos_order_code = candidate
        break
      end
    end
  end
end
