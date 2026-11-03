# frozen_string_literal: true

class ClassType < ApplicationRecord
  belongs_to :shop
  has_many :class_schedules, dependent: :restrict_with_error
  validates :name, presence: true, length: { maximum: 100 }, uniqueness: { scope: :shop_id }
  validates :color, format: { with: /\A#[0-9a-fA-F]{6}\z/ }
  validates :default_capacity, numericality: { only_integer: true, in: 1..500 }
  validates :default_duration_minutes, numericality: { only_integer: true, in: 5..720 }
end
