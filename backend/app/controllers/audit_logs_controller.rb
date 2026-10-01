# frozen_string_literal: true

class AuditLogsController < ApiController
  def index
    combined = FetchAuditLogsQuery.call(current_shop, params)

    render json: {
      audit_logs: combined,
      meta: { total: combined.size, page: params[:page]&.to_i || 1 }
    }
  end
end
