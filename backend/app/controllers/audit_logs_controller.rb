# frozen_string_literal: true

class AuditLogsController < ApiController
  def index
    logs = current_shop.audit_logs.recent

    # Optional filters
    logs = logs.by_action(params[:action]) if params[:action].present?
    logs = logs.by_staff(params[:staff_id]) if params[:staff_id].present?

    render json: {
      audit_logs: logs.map do |log|
        {
          id: log.id,
          action: log.action,
          staff_name: log.staff&.name,
          target_type: log.target_type,
          target_id: log.target_id,
          details: log.details,
          created_at: log.created_at.iso8601
        }
      end,
      meta: { total: logs.count, page: params[:page]&.to_i || 1 }
    }
  end
end
