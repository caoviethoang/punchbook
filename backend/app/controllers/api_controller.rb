# frozen_string_literal: true

# Base for shop-scoped JSON API endpoints.
# AuthController stays on ApplicationController so register/login remain public.
class ApiController < ApplicationController
  before_action :authenticate_shop!

  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :render_record_invalid
  rescue_from ActionController::ParameterMissing, with: :render_unprocessable_exception
  rescue_from CheckInMembership::Error, PayosService::Error, with: :render_unprocessable_exception

  private

  def find_shop_membership(id)
    current_shop.memberships.includes(:package).find(id)
  end

  def render_not_found(_exception = nil)
    render json: { error: 'Not found' }, status: :not_found
  end

  def render_record_invalid(exception)
    render_unprocessable(exception.record.errors.full_messages)
  end

  def render_unprocessable_exception(exception)
    render_unprocessable_message(exception.message)
  end

  def render_unprocessable(messages)
    render json: { errors: Array(messages) }, status: :unprocessable_content
  end

  def render_unprocessable_message(message)
    render json: { error: message }, status: :unprocessable_content
  end
end
