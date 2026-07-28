# frozen_string_literal: true

class Package < ApplicationRecord
  belongs_to :shop
  has_many :memberships, dependent: :destroy

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
