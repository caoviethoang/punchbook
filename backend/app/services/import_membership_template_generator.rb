# frozen_string_literal: true

require 'caxlsx'

# Service to generate a sample Excel template for importing memberships.
class ImportMembershipTemplateGenerator
  HEADERS = [
    'Tên hội viên',
    'Số điện thoại',
    'Gói cước',
    'Số buổi còn lại / Ngày hết hạn'
  ].freeze

  SAMPLE_ROWS = [
    ['Nguyễn Văn A', '0901234567', 'Gói 10 buổi', '10'],
    ['Trần Thị B', '0912345678', 'Gói 1 tháng', '30/09/2026']
  ].freeze

  def self.call
    new.call
  end

  def call
    package = Axlsx::Package.new
    workbook = package.workbook

    workbook.add_worksheet(name: 'Template Import') do |sheet|
      sheet.add_row HEADERS
      SAMPLE_ROWS.each do |row|
        sheet.add_row row, types: %i[string string string string]
      end
    end

    package.to_stream.read
  end
end
