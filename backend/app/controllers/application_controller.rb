# frozen_string_literal: true

class ApplicationController < ActionController::API
  include Authenticatable

  rescue_from CanCan::AccessDenied do |_exception|
    render json: { error: 'Access denied. You do not have permission to perform this action.' }, status: :forbidden
  end
end
