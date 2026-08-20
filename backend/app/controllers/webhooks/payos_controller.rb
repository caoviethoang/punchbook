# frozen_string_literal: true

module Webhooks
  class PayosController < ApplicationController
    def create
      success, status_code = ProcessPayosWebhook.call(params)

      if success
        render json: { status: 'success' }, status: :ok
      elsif status_code == :invalid_signature
        render json: { error: 'Invalid signature' }, status: :bad_request
      else
        render json: { error: 'Webhook processing failed' }, status: :unprocessable_content
      end
    end
  end
end
