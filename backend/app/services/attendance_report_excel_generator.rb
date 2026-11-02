# frozen_string_literal: true

require 'caxlsx'

# Service to generate a monthly attendance Excel report.
class AttendanceReportExcelGenerator
  def self.call(shop:, month_str: nil)
    new(shop: shop, month_str: month_str).call
  end

  def initialize(shop:, month_str: nil)
    @shop = shop
    @month_str = month_str
    @query_result = AttendanceReportQuery.new(shop, month_str)
  end

  def call
    package = Axlsx::Package.new
    workbook = package.workbook

    add_attendance_sheet(workbook)

    package.to_stream.read
  end

  private

  attr_reader :shop, :month_str, :query_result

  def add_attendance_sheet(workbook)
    report_data = query_result.to_h
    workbook.add_worksheet(name: "Chuyen can #{report_data[:month]}") do |sheet|
      add_title_rows(sheet, report_data)
      sheet.add_row table_headers
      report_data[:attendance].each { |row| sheet.add_row attendance_row(row) }
    end
  end

  def add_title_rows(sheet, report_data)
    summary = report_data[:summary]
    sheet.add_row ["BÁO CÁO CHUYÊN CẦN HỘI VIÊN - THÁNG #{report_data[:month]}"]
    sheet.add_row ["Cửa hàng: #{shop.name}"]
    sheet.add_row [
      "Tổng hội viên: #{summary[:total_members]} | " \
      "Đã đi tập: #{summary[:active_members_count]} | " \
      "Chưa đi tập: #{summary[:inactive_members_count]} | " \
      "Tổng lượt check-in: #{summary[:total_check_ins]}"
    ]
    sheet.add_row []
  end

  def table_headers
    [
      'Xếp hạng',
      'Tên hội viên',
      'Số điện thoại',
      'Gói dịch vụ',
      'Trạng thái hội viên',
      'Số buổi tập trong tháng',
      'Buổi tập gần nhất',
      'Đánh giá chuyên cần'
    ]
  end

  def attendance_row(row)
    [
      row[:rank] ? "##{row[:rank]}" : '-',
      row[:customer_name],
      row[:phone],
      row[:package_name],
      membership_status_label(row[:status]),
      row[:check_ins_count],
      format_last_check_in(row[:last_check_in_at]),
      evaluation_label(row)
    ]
  end

  def format_last_check_in(last_check_in_at)
    return 'Chưa có' if last_check_in_at.blank?

    Time.zone.parse(last_check_in_at).strftime('%d/%m/%Y %H:%M')
  end

  def evaluation_label(row)
    if row[:is_inactive]
      'Chưa đi tập (Nguy cơ bỏ tập)'
    elsif row[:check_ins_count] >= 12
      'Rất tích cực (>= 3 buổi/tuần)'
    elsif row[:check_ins_count] >= 4
      'Đều đặn (>= 1 buổi/tuần)'
    else
      'Ít đi tập (< 1 buổi/tuần)'
    end
  end

  def membership_status_label(status)
    case status.to_s
    when 'active' then 'Đang hoạt động'
    when 'expiring' then 'Sắp hết hạn'
    when 'expired' then 'Đã hết hạn'
    else status.to_s
    end
  end
end
