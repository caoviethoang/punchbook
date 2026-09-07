# frozen_string_literal: true

class AuditLogsController < ApiController
  def index
    logs = current_shop.audit_logs.includes(:staff).recent

    # Optional filters (use :log_action to avoid clash with reserved params[:action])
    logs = logs.by_action(params[:log_action]) if params[:log_action].present?
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
