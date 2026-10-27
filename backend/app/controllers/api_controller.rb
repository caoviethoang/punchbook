# frozen_string_literal: true

# Base for shop-scoped JSON API endpoints.
# AuthController stays on ApplicationController so register/login remain public.
class ApiController < ApplicationController
  wrap_parameters false

  before_action :authenticate_shop!
  before_action :set_paper_trail_whodunnit

  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :render_record_invalid
  rescue_from ActionController::ParameterMissing, with: :render_parameter_missing
  rescue_from CheckInMembership::Error, PayosService::Error, with: :render_business_exception

  private

  def set_paper_trail_whodunnit
    PaperTrail.request.whodunnit = current_staff&.name || current_staff&.id || current_shop&.id
  end

  def find_shop_membership(id)
    current_shop.memberships.includes(:package).find(id)
  end

  def render_not_found(_exception = nil)
    render_error('Not found', code: 'NOT_FOUND', status: :not_found)
  end

  def render_record_invalid(exception)
    render_validation_errors(
      exception.record.errors.full_messages,
      details: exception.record.errors.to_hash
    )
  end

  def render_parameter_missing(exception)
    render_error(exception.message, code: 'PARAMETER_MISSING', status: :unprocessable_content)
  end

  def render_business_exception(exception)
    render_error(exception.message, code: 'BUSINESS_ERROR', status: :unprocessable_content)
  end

  def render_validation_errors(messages, details: nil)
    msgs = Array(messages)
    details_hash = details.presence || { errors: msgs }
    render json: {
      error: msgs.join(', '),
      code: 'VALIDATION_ERROR',
      details: details_hash,
      errors: msgs
    }, status: :unprocessable_content
  end

  alias render_unprocessable render_validation_errors

  def render_unprocessable_message(message, code: 'UNPROCESSABLE_ENTITY', details: nil)
    render_error(message, code: code, status: :unprocessable_content, details: details)
  end
end
