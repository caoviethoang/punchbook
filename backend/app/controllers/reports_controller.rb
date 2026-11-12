# frozen_string_literal: true

class ReportsController < ApiController
  before_action :require_admin!, except: :trainer_commissions
  before_action :authorize_trainer_commission!, only: :trainer_commissions
  before_action :ensure_paid_plan!, only: %i[export export_attendance export_trainer_commissions]

  def export
    excel_data = ExcelReportGenerator.call(shop: current_shop)
    filename = "punchbook_report_#{current_shop.id}_#{Time.current.strftime('%Y%m%d%H%M%S')}.xlsx"

    send_data(
      excel_data,
      filename: filename,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment'
    )
  end

  def attendance
    report = AttendanceReportQuery.call(current_shop, params[:month])
    render json: report
  end

  def export_attendance
    month = params[:month].presence || Time.zone.today.strftime('%Y-%m')
    excel_data = AttendanceReportExcelGenerator.call(shop: current_shop, month_str: month)
    filename = "punchbook_attendance_#{month}_#{Time.current.strftime('%Y%m%d%H%M%S')}.xlsx"

    send_data(
      excel_data,
      filename: filename,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment'
    )
  end

  def trainer_commissions
    target_trainer_id = current_staff&.trainer? ? current_staff.id : params[:trainer_id]
    report = TrainerCommissionReportQuery.call(current_shop, params[:month], trainer_id: target_trainer_id)
    render json: report
  end

  def export_trainer_commissions
    month = params[:month].presence || Time.zone.today.strftime('%Y-%m')
    excel = TrainerCommissionExcelGenerator.call(shop: current_shop, month_str: month, trainer_id: params[:trainer_id])
    send_excel(excel, "punchbook_trainer_commissions_#{month}_#{Time.current.strftime('%Y%m%d%H%M%S')}.xlsx")
  end

  private

  def send_excel(data, filename)
    send_data(
      data,
      filename: filename,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment'
    )
  end

  def authorize_trainer_commission!
    return if current_staff&.admin?

    if current_staff&.trainer? && (params[:trainer_id].blank? || params[:trainer_id].to_s == current_staff.id.to_s)
      return
    end

    raise CanCan::AccessDenied
  end

  def ensure_paid_plan!
    return if current_shop.plan == 'paid'

    render_error(
      I18n.t(
        'errors.plan_upgrade_required',
        default: 'Gói Free không hỗ trợ xuất báo cáo Excel. Vui lòng nâng cấp gói trả phí để sử dụng tính năng này.'
      ),
      code: 'PLAN_UPGRADE_REQUIRED',
      status: :forbidden
    )
  end
end
