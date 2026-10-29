# frozen_string_literal: true

module Webhooks
  class PayosController < ApplicationController
    def create
      raw_payload = payload_params
      webhook_event = record_incoming_webhook(raw_payload)

      process_incoming_webhook(webhook_event, raw_payload)
    rescue StandardError => e
      handle_unexpected_error(webhook_event, e)
    end

    private

    def payload_params
      params.to_unsafe_h.except('controller', 'action')
    end

    def extract_order_code(payload)
      data = payload['data'] || payload[:data]
      return nil unless data.is_a?(Hash) || data.respond_to?(:to_unsafe_h)

      data_hash = data.respond_to?(:to_unsafe_h) ? data.to_unsafe_h : data.to_h
      code = data_hash['orderCode'] || data_hash[:orderCode]
      code.to_s.match?(/\A\d+\z/) ? code.to_i : nil
    end

    def record_incoming_webhook(payload)
      shop = WebhookEvent.resolve_shop_from_payload(payload)
      WebhookEvent.create!(
        source: 'payos',
        event_type: 'payment',
        order_code: extract_order_code(payload),
        payload: payload,
        status: WebhookEvent::STATUS_PENDING,
        shop: shop
      )
    end

    def process_incoming_webhook(event, payload)
      event.increment_attempts!
      success, status_code = ProcessPayosWebhook.call(payload)

      if success
        event.mark_success!
        render json: { status: 'success' }, status: :ok
      elsif status_code == :invalid_signature
        render_invalid_signature(event)
      else
        handle_failure(event, "Webhook processing failed: #{status_code}")
      end
    end

    def render_invalid_signature(event)
      event.mark_invalid_signature!('Invalid signature')
      render json: { error: 'Invalid signature', code: 'INVALID_SIGNATURE' }, status: :bad_request
    end

    def handle_failure(event, message)
      event.mark_failed!(message)
      ProcessPayosWebhookJob.perform_async(event.id)
      render json: { error: 'Webhook processing failed', code: 'WEBHOOK_FAILED' }, status: :unprocessable_content
    end

    def handle_unexpected_error(event, error)
      if event
        event.increment_attempts!
        event.mark_failed!(error.message)
        ProcessPayosWebhookJob.perform_async(event.id)
      end
      render json: { error: 'Webhook processing failed' }, status: :unprocessable_content
    end
  end
end
