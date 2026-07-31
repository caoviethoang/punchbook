# frozen_string_literal: true

# Base for shop-scoped JSON API endpoints (memberships, check-in, dashboard, …).
# AuthController stays on ApplicationController so register/login remain public.
class ApiController < ApplicationController
  before_action :authenticate_shop!
end
