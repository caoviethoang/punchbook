# frozen_string_literal: true

class WebhookEventsController < ApiController
  before_action :require_admin!
  before_action :set_webhook_event, only: [:retry]

  def index
    paginated_events, meta = fetch_paginated_events

    render json: {
      webhook_events: paginated_events.map(&:as_api_json),
      meta: meta
    }
  end

  def retry
    unless @webhook_event.retryable?
      return render json: { error: 'Webhook event is not in a retryable state' }, status: :unprocessable_content
    end

    @webhook_event.update!(status: WebhookEvent::STATUS_PENDING, last_error: nil)
    ProcessPayosWebhookJob.perform_async(@webhook_event.id)

    render json: {
      webhook_event: @webhook_event.as_api_json,
      message: 'Webhook retry successfully enqueued'
    }, status: :ok
  end

  private

  def fetch_paginated_events
    events = filtered_events
    page = [params[:page].to_i, 1].max
    per_page = (params[:per_page].presence&.to_i || 20).clamp(1, 100)

    [
      events.offset((page - 1) * per_page).limit(per_page),
      { total: events.count, page: page, per_page: per_page }
    ]
  end

  def filtered_events
    events = WebhookEvent.for_shop(current_shop).recent
    params[:status].present? ? events.where(status: params[:status]) : events
  end

  def set_webhook_event
    @webhook_event = WebhookEvent.for_shop(current_shop).find(params.expect(:id))
  end
end
