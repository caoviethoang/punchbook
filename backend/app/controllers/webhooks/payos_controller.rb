# frozen_string_literal: true

module Webhooks
  class PayosController < ApplicationController
    def create
      success, status_code = ProcessPayosWebhook.call(params)

      if success
        render json: { status: 'success' }, status: :ok
      elsif status_code == :invalid_signature
        render_error('Invalid signature', code: 'INVALID_SIGNATURE', status: :bad_request)
      else
        render_error('Webhook processing failed', code: 'WEBHOOK_FAILED', status: :unprocessable_content)
      end
    end
  end
end
