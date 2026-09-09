# frozen_string_literal: true

class Shop < ApplicationRecord
  PLANS = %w[free paid].freeze

  devise :database_authenticatable, :registerable, :validatable

  has_many :staffs, dependent: :destroy, inverse_of: :shop
  has_many :packages, dependent: :destroy, inverse_of: :shop
  has_many :memberships, dependent: :destroy, inverse_of: :shop

  validates :plan, presence: true, inclusion: { in: PLANS }
  validates :name, presence: true

  scope :paid, -> { where(plan: 'paid') }
end
