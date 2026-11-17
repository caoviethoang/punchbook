# frozen_string_literal: true

class HardwareDevice < ApplicationRecord
  DEVICE_TYPES = %w[turnstile magnetic_lock barcode_scanner nfc_reader].freeze

  belongs_to :shop, inverse_of: :hardware_devices
  has_many :check_ins, dependent: :nullify, inverse_of: :hardware_device

  has_secure_token :device_token

  validates :name, presence: true
  validates :device_type, presence: true, inclusion: { in: DEVICE_TYPES }
  validates :device_token, uniqueness: true

  scope :active, -> { where(is_active: true) }
  scope :online, -> { where(last_ping_at: 5.minutes.ago..) }

  def online?
    last_ping_at.present? && last_ping_at >= 5.minutes.ago
  end

  def status
    online? ? 'online' : 'offline'
  end

  def ping!
    update!(last_ping_at: Time.current)
  end

  def as_api_json
    slice(
      :id, :shop_id, :name, :device_token, :device_type,
      :location, :last_ping_at, :is_active, :created_at, :updated_at
    ).merge(online: online?, status: status)
  end
end
