# frozen_string_literal: true

class ReportsController < ApiController
  before_action :ensure_paid_plan!

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

  private

  def ensure_paid_plan!
    return if current_shop.plan == 'paid'

    render json: {
      error: 'Gói Free không hỗ trợ xuất báo cáo Excel. Vui lòng nâng cấp gói trả phí để sử dụng tính năng này.'
    }, status: :forbidden
  end
end
