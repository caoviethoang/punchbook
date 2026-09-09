# frozen_string_literal: true

class Package < ApplicationRecord
  belongs_to :shop, inverse_of: :packages
  has_many :memberships, dependent: :destroy, inverse_of: :package

  validates :name, presence: true
  validates :price, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :sessions_count, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validates :duration_days, numericality: { only_integer: true, greater_than: 0 }, allow_nil: true
  validate :exactly_one_of_sessions_count_or_duration_days

  def session_based?
    sessions_count.present?
  end

  def day_based?
    duration_days.present?
  end

  private

  def exactly_one_of_sessions_count_or_duration_days
    return if session_based? ^ day_based?

    errors.add(:base, 'Must set exactly one of sessions_count or duration_days')
  end
end
