# frozen_string_literal: true

class ProcessPayosWebhookJob
  include Sidekiq::Job

  sidekiq_options queue: :webhooks, retry: 5

  sidekiq_retries_exhausted do |msg, ex|
    event_id = msg['args']&.first
    event = WebhookEvent.find_by(id: event_id)
    next unless event

    event.mark_dead_letter!("Retries exhausted: #{ex&.message}")
    Rails.logger.warn(
      "[PayOS Webhook DLQ] WebhookEvent ##{event.id} (order: #{event.order_code}) " \
      "moved to dead-letter queue: #{ex&.message}"
    )
  end

  def perform(event_id)
    event = WebhookEvent.find_by(id: event_id)
    return if event.nil? || event.status == WebhookEvent::STATUS_SUCCESS

    prepare_and_run(event)
  rescue StandardError => e
    record_error(event, e.message) if event && event.status != WebhookEvent::STATUS_DEAD_LETTER
    raise e
  end

  private

  def prepare_and_run(event)
    event.increment_attempts!
    event.update!(status: WebhookEvent::STATUS_PROCESSING)
    relink_shop_if_needed(event)

    success, status_code = ProcessPayosWebhook.call(event.payload)
    if success
      event.mark_success!
    else
      handle_failure(event, "Webhook processing failed with status: #{status_code}")
    end
  end

  def relink_shop_if_needed(event)
    return if event.shop_id.present?

    resolved_shop = WebhookEvent.resolve_shop_from_payload(event.payload)
    event.update!(shop: resolved_shop) if resolved_shop
  end

  def handle_failure(event, message)
    event.mark_failed!(message)
    raise StandardError, message
  end

  def record_error(event, message)
    event.update!(
      status: WebhookEvent::STATUS_FAILED,
      last_error: message,
      failed_at: Time.current
    )
  end
end
