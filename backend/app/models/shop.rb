# frozen_string_literal: true

class Shop < ApplicationRecord
  PLANS = %w[free paid].freeze

  has_many :staffs, dependent: :destroy
  has_many :packages, dependent: :destroy
  has_many :memberships, dependent: :destroy

  validates :plan, presence: true, inclusion: { in: PLANS }
end
