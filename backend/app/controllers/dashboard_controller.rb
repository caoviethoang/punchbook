# frozen_string_literal: true

class DashboardController < ApiController
  def show
    render json: DashboardQuery.call(current_shop)
  end
end
