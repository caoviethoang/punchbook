# frozen_string_literal: true

require 'caxlsx'

# Service to generate a monthly Personal Trainer (PT) commission Excel report.
class TrainerCommissionExcelGenerator
  SUMMARY_HEADERS = [
    'Huấn luyện viên',
    'Vai trò',
    'Học viên phụ trách',
    'Số buổi hoàn thành',
    'Hoa hồng buổi dạy (VND)',
    'Số gói đã bán',
    'Doanh số bán gói (VND)',
    'Hoa hồng doanh số (VND)',
    'Tổng hoa hồng (VND)'
  ].freeze

  def self.call(shop:, month_str: nil, trainer_id: nil)
    new(shop: shop, month_str: month_str, trainer_id: trainer_id).call
  end

  def initialize(shop:, month_str: nil, trainer_id: nil)
    @shop = shop
    @report_data = TrainerCommissionReportQuery.call(shop, month_str, trainer_id: trainer_id)
  end

  def call
    package = Axlsx::Package.new
    workbook = package.workbook

    add_summary_sheet(workbook)
    add_sessions_sheet(workbook)

    package.to_stream.read
  end

  private

  attr_reader :shop, :report_data

  def add_summary_sheet(workbook)
    workbook.add_worksheet(name: "Hoa hong PT #{report_data[:month]}") do |sheet|
      add_title_rows(sheet)
      sheet.add_row SUMMARY_HEADERS
      report_data[:trainers].each { |row| sheet.add_row trainer_row(row) }
    end
  end

  def add_sessions_sheet(workbook)
    workbook.add_worksheet(name: 'Chi tiet buoi day') do |sheet|
      sheet.add_row ["CHI TIẾT BUỔI DẠY PT - THÁNG #{report_data[:month]}"]
      sheet.add_row []
      sheet.add_row ['Thời gian', 'Huấn luyện viên', 'Hội viên', 'Gói dịch vụ', 'Hoa hồng (VND)']
      report_data[:sessions].each { |s| sheet.add_row session_row(s) }
    end
  end

  def add_title_rows(sheet)
    summary = report_data[:summary]
    sheet.add_row ["BÁO CÁO HOA HỒNG HUẤN LUYỆN VIÊN (PT) - THÁNG #{report_data[:month]}"]
    sheet.add_row ["Cửa hàng: #{shop.name}"]
    sheet.add_row [
      "Số PT: #{summary[:total_trainers]} | " \
      "Tổng buổi dạy: #{summary[:total_sessions_completed]} | " \
      "Doanh số bán gói: #{summary[:total_sales_amount]} đ | " \
      "Tổng hoa hồng: #{summary[:total_commission]} đ"
    ]
    sheet.add_row []
  end

  def trainer_row(row)
    role_label = row[:trainer_role] == 'trainer' ? 'Huấn luyện viên (PT)' : 'Quản trị viên'
    [
      row[:trainer_name], role_label, row[:assigned_clients_count],
      row[:sessions_completed], row[:session_commission],
      row[:sales_count], row[:sales_amount], row[:sale_commission], row[:total_commission]
    ]
  end

  def session_row(session)
    raw = session[:checked_in_at]
    time_str = raw.present? ? Time.zone.parse(raw).strftime('%d/%m/%Y %H:%M') : ''
    [time_str, session[:trainer_name], session[:customer_name], session[:package_name], session[:commission_amount]]
  end
end
