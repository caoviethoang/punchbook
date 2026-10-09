# frozen_string_literal: true

require 'roo'

# Service class for spreadsheet file parsing and date/phone formatting
class SpreadsheetParser
  ROO_READERS = {
    '.csv' => ->(p) { Roo::CSV.new(p) },
    '.xlsx' => ->(p) { Roo::Excelx.new(p) },
    '.xls' => ->(p) { Roo::Excel.new(p) }
  }.freeze

  HEADER_PATTERNS = {
    name: /tên|name/i,
    phone: /điện thoại|sđt|phone/i,
    pkg: /gói|package/i,
    val: /buổi|hạn|ngày/i
  }.freeze

  def self.open(file)
    path = file.respond_to?(:path) ? file.path : file.to_s
    filename = file.respond_to?(:original_filename) ? file.original_filename : path
    ROO_READERS[File.extname(filename).downcase]&.call(path)
  rescue StandardError => e
    Rails.logger.error("Spreadsheet open error: #{e.message}")
    nil
  end

  def self.find_column_indexes(header_row)
    idx = { name: 0, phone: 1, pkg: 2, val: 3 }
    header_row.each_with_index do |col, i|
      val = col.to_s.strip
      HEADER_PATTERNS.each { |k, pat| idx[k] = i if val.match?(pat) }
    end
    [idx[:name], idx[:phone], idx[:pkg], idx[:val]]
  end

  def self.extract_row_data(row, col_indexes)
    phone = format_phone(row[col_indexes[1]])

    {
      name: row[col_indexes[0]].to_s.strip,
      phone: phone,
      pkg_name: row[col_indexes[2]].to_s.strip,
      val_override: row[col_indexes[3]].to_s.strip
    }
  end

  def self.format_phone(raw)
    cleaned = raw.to_s.strip.sub(/\.0$/, '')
    cleaned.match?(/^\d{9}$/) ? "0#{cleaned}" : cleaned
  end

  def self.parse_date(val)
    return val.to_date if val.respond_to?(:to_date)

    Date.strptime(val, '%d/%m/%Y')
  rescue ArgumentError, TypeError
    try_parse_date(val)
  end

  def self.try_parse_date(val)
    Date.parse(val)
  rescue ArgumentError, TypeError
    nil
  end
end
