# frozen_string_literal: true

class NotificationLog < ApplicationRecord
  CHANNELS = %w[zalo sms email].freeze
  EVENT_TYPES = %w[welcome check_in_receipt payment_receipt expiring_reminder].freeze
  STATUSES = %w[sent failed skipped].freeze

  belongs_to :shop
  belongs_to :membership, optional: true

  validates :channel, presence: true, inclusion: { in: CHANNELS }
  validates :event_type, presence: true, inclusion: { in: EVENT_TYPES }
  validates :recipient, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :recent, -> { order(created_at: :desc) }
  scope :by_channel, ->(ch) { where(channel: ch) if ch.present? }
  scope :by_status, ->(st) { where(status: st) if st.present? }
  scope :by_event_type, ->(evt) { where(event_type: evt) if evt.present? }

  def as_api_json
    base_attributes.merge(status_attributes)
  end

  private

  def base_attributes
    {
      'id' => id,
      'shop_id' => shop_id,
      'membership_id' => membership_id,
      'customer_name' => membership&.customer_name,
      'channel' => channel,
      'event_type' => event_type,
      'recipient' => recipient
    }
  end

  def status_attributes
    {
      'status' => status,
      'error_message' => error_message,
      'metadata' => metadata,
      'sent_at' => sent_at&.iso8601,
      'created_at' => created_at&.iso8601
    }
  end
end
