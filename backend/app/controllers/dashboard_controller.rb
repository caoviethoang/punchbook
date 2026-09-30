# frozen_string_literal: true

class DashboardController < ApiController
  before_action :require_owner!
  def show
    render json: DashboardQuery.call(current_shop)
  end
end
