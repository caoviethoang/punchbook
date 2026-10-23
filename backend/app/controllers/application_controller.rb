# frozen_string_literal: true

require 'cancan'

class ApplicationController < ActionController::API
  include Authenticatable

  rescue_from CanCan::AccessDenied do |_exception|
    render_error(
      'Access denied. You do not have permission to perform this action.',
      code: 'FORBIDDEN',
      status: :forbidden
    )
  end

  private

  def render_error(message, code: 'ERROR', status: :unprocessable_content, details: nil)
    payload = { error: message, code: code }
    payload[:details] = details if details.present?
    render json: payload, status: status
  end
end
