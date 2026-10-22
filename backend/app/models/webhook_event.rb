# frozen_string_literal: true

class WebhookEvent < ApplicationRecord
  STATUS_PENDING = 'pending'
  STATUS_PROCESSING = 'processing'
  STATUS_SUCCESS = 'success'
  STATUS_FAILED = 'failed'
  STATUS_DEAD_LETTER = 'dead_letter'
  STATUS_INVALID_SIGNATURE = 'invalid_signature'

  STATUSES = [
    STATUS_PENDING,
    STATUS_PROCESSING,
    STATUS_SUCCESS,
    STATUS_FAILED,
    STATUS_DEAD_LETTER,
    STATUS_INVALID_SIGNATURE
  ].freeze

  DEFAULT_MAX_ATTEMPTS = 5

  belongs_to :shop, optional: true, inverse_of: :webhook_events

  validates :source, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :attempts, numericality: { greater_than_or_equal_to: 0 }
  validates :max_attempts, numericality: { greater_than: 0 }

  scope :recent, -> { order(created_at: :desc) }
  scope :failed_or_dead, -> { where(status: [STATUS_FAILED, STATUS_DEAD_LETTER]) }

  scope :for_shop, lambda { |shop|
    where(shop_id: shop.id)
      .or(where(shop_id: nil, order_code: shop.invoices.select(:payos_order_code)))
      .or(where(shop_id: nil, order_code: shop.shop_plan_payments.select(:payos_order_code)))
  }

  def retryable?
    [STATUS_FAILED, STATUS_DEAD_LETTER].include?(status)
  end

  def increment_attempts!
    update!(attempts: attempts + 1)
  end

  def mark_success!
    update!(status: STATUS_SUCCESS, processed_at: Time.current, last_error: nil)
  end

  def mark_failed!(error_message)
    update!(status: STATUS_FAILED, failed_at: Time.current, last_error: error_message)
  end

  def mark_dead_letter!(error_message)
    update!(status: STATUS_DEAD_LETTER, failed_at: Time.current, last_error: error_message)
  end

  def mark_invalid_signature!(error_message = 'Invalid signature')
    update!(status: STATUS_INVALID_SIGNATURE, failed_at: Time.current, last_error: error_message)
  end

  def as_api_json
    {
      id: id, shop_id: shop_id, source: source, event_type: event_type,
      order_code: order_code, payload: payload, status: status,
      attempts: attempts, max_attempts: max_attempts, last_error: last_error,
      processed_at: processed_at, failed_at: failed_at,
      created_at: created_at, updated_at: updated_at, retryable: retryable?
    }
  end

  def self.resolve_shop_from_payload(payload)
    order_code, data_hash = extract_order_info(payload)
    return nil if order_code.blank?

    target = PayosWebhookTargetFinder.call(order_code, data_hash)
    target_shop(target)
  rescue StandardError
    nil
  end

  def self.extract_order_info(payload)
    return [nil, {}] if payload.blank?

    hash = payload.respond_to?(:to_unsafe_h) ? payload.to_unsafe_h : payload.to_h
    data_hash = extract_data_hash(hash['data'] || hash[:data])
    [data_hash['orderCode'] || data_hash[:orderCode], data_hash]
  end

  def self.extract_data_hash(data)
    if data.respond_to?(:to_unsafe_h)
      data.to_unsafe_h
    elsif data.is_a?(Hash)
      data.to_h
    else
      {}
    end
  end

  def self.target_shop(target)
    case target
    when Invoice then target.membership&.shop
    when ShopPlanPayment then target.shop
    end
  end
end
