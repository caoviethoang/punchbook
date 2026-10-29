# frozen_string_literal: true

class Shop < ApplicationRecord
  PLANS = %w[free paid].freeze

  devise :database_authenticatable, :registerable, :validatable

  has_many :staffs, dependent: :destroy, inverse_of: :shop
  has_many :package_categories, dependent: :destroy, inverse_of: :shop
  has_many :packages, dependent: :destroy, inverse_of: :shop
  has_many :memberships, dependent: :destroy, inverse_of: :shop
  has_many :check_ins, through: :memberships
  has_many :invoices, through: :memberships
  has_many :audit_logs, dependent: :destroy, inverse_of: :shop
  has_many :shop_plan_payments, dependent: :destroy, inverse_of: :shop
  has_many :webhook_events, dependent: :nullify, inverse_of: :shop

  validates :plan, presence: true, inclusion: { in: PLANS }
  validates :name, presence: true
  validates :device_api_key, uniqueness: true, allow_nil: true

  before_validation :generate_device_api_key, on: :create

  scope :paid, -> { where(plan: 'paid') }

  def regenerate_device_api_key!
    update!(device_api_key: "pb_dev_#{SecureRandom.hex(24)}")
  end

  private

  def generate_device_api_key
    self.device_api_key ||= "pb_dev_#{SecureRandom.hex(24)}"
  end
end
