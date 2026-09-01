# frozen_string_literal: true

require 'caxlsx'

# Service to generate sample Excel import template for memberships (template_import_memberships.xlsx)
class ImportMembershipsTemplateGenerator
  def self.call(shop: nil)
    new(shop: shop).call
  end

  def initialize(shop: nil)
    @shop = shop
  end

  def call
    package = Axlsx::Package.new
    workbook = package.workbook

    add_import_sheet(workbook)
    add_instructions_sheet(workbook)

    package.to_stream.read
  end

  private

  attr_reader :shop

  def add_import_sheet(workbook)
    workbook.add_worksheet(name: 'Danh sách hội viên') do |sheet|
      sheet.add_row ['Tên hội viên', 'Số điện thoại', 'Gói cước', 'Số buổi còn lại', 'Ngày hết hạn']

      sample_package_name = sample_packages.first&.name || 'Gói 10 Buổi'
      sample_day_package_name = sample_packages.find(&:day_based?)&.name || 'Gói 1 Tháng'

      sheet.add_row ['Nguyễn Văn A', '0901234567', sample_package_name, 10, '']
      sheet.add_row ['Trần Thị B', '0912345678', sample_day_package_name, '',
                     (Date.current + 30.days).strftime('%d/%m/%Y')]
    end
  end

  # rubocop:disable Metrics/AbcSize, Metrics/MethodLength
  def add_instructions_sheet(workbook)
    workbook.add_worksheet(name: 'Hướng dẫn') do |sheet|
      sheet.add_row ['Cột', 'Bắt buộc', 'Định dạng', 'Mô tả chi tiết']
      sheet.add_row ['Tên hội viên', 'Có', 'Văn bản', 'Họ và tên của hội viên (ví dụ: Nguyễn Văn A)']
      sheet.add_row ['Số điện thoại', 'Có', 'Văn bản / Số', 'Số điện thoại liên hệ (ví dụ: 0901234567)']
      sheet.add_row ['Gói cước', 'Có', 'Văn bản', 'Tên gói dịch vụ đã tạo trên hệ thống PunchBook']
      sheet.add_row ['Số buổi còn lại', 'Không', 'Số nguyên',
                     'Dành cho gói theo buổi. Để trống sẽ lấy mặc định theo gói']
      sheet.add_row ['Ngày hết hạn', 'Không', 'DD/MM/YYYY hoặc YYYY-MM-DD',
                     'Dành cho gói theo ngày. Để trống sẽ tự tính theo thời hạn gói']

      if available_packages.any?
        sheet.add_row []
        sheet.add_row ['Danh sách gói hiện có tại cửa hàng:', '', '', '']
        available_packages.each do |pkg|
          type_desc = pkg.session_based? ? "#{pkg.sessions_count} buổi" : "#{pkg.duration_days} ngày"
          sheet.add_row [pkg.name, type_desc, number_to_vnd(pkg.price), '']
        end
      end
    end
  end
  # rubocop:enable Metrics/AbcSize, Metrics/MethodLength

  def sample_packages
    @sample_packages ||= available_packages.presence || []
  end

  def available_packages
    return [] unless shop

    @available_packages ||= shop.packages.order(created_at: :asc)
  end

  def number_to_vnd(amount)
    "#{amount.to_i.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1.').reverse} đ"
  end
end
