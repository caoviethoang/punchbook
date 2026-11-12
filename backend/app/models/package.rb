# frozen_string_literal: true

class Package < ApplicationRecord
  include Discard::Model

  COMMISSION_TYPES = %w[flat percent].freeze

  has_paper_trail

  default_scope { kept }

  belongs_to :shop, inverse_of: :packages
  belongs_to :package_category, optional: true, inverse_of: :packages
  has_many :memberships, dependent: :destroy, inverse_of: :package

  validates :name, presence: true
  validates :price, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :sessions_count, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :duration_days, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :commission_type, inclusion: { in: COMMISSION_TYPES }
  validates :commission_rate, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :sale_commission_rate, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :exactly_one_of_sessions_count_or_duration_days

  def session_based?
    sessions_count.present?
  end

  def day_based?
    duration_days.present?
  end

  def calculate_session_commission
    return 0 unless pt_package?

    if commission_type == 'percent'
      session_val = sessions_count.to_i.positive? ? (price / sessions_count) : price
      (session_val * commission_rate / 100.0).round
    else
      commission_rate
    end
  end

  def calculate_sale_commission(sale_price = nil)
    return 0 unless pt_package?

    base_price = sale_price || price
    (base_price * sale_commission_rate / 100.0).round
  end

  private

  def exactly_one_of_sessions_count_or_duration_days
    return if session_based? ^ day_based?

    errors.add(:base, 'Must set exactly one of sessions_count or duration_days')
  end
end
