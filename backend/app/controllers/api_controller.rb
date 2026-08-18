# frozen_string_literal: true

# Base for shop-scoped JSON API endpoints (memberships, check-in, dashboard, …).
# AuthController stays on ApplicationController so register/login remain public.
class ApiController < ApplicationController
  before_action :authenticate_shop!

  private

  # Thin rescue helpers — call these from action rescue blocks to keep
  # controller actions free of render boilerplate.
  def render_not_found
    render json: { error: 'Not found' }, status: :not_found
  end

  def render_unprocessable(messages)
    render json: { errors: Array(messages) }, status: :unprocessable_content
  end

  def render_unprocessable_message(message)
    render json: { error: message }, status: :unprocessable_content
  end
end
