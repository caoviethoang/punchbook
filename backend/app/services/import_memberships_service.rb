# frozen_string_literal: true

require 'roo'

# Service object to parse Excel/CSV files and import memberships into a shop.
class ImportMembershipsService
  Result = Struct.new(:total_rows, :success_count, :failed_count, :errors, keyword_init: true)

  INVALID_FILE_MSG = 'Định dạng file không hợp lệ. Chỉ chấp nhận .xlsx, .xls hoặc .csv'
  QUOTA_EXCEEDED_MSG = 'Gói Free chỉ được tạo tối đa 15 hội viên. Vui lòng nâng cấp gói trả phí.'

  def self.call(shop:, file:)
    new(shop: shop, file: file).call
  end

  def initialize(shop:, file:)
    @shop = shop
    @file = file
    @success_count = 0
    @errors = []
    @current_count = shop.memberships.count
    @packages_map = shop.packages.index_by { |p| p.name.strip.downcase }
  end

  def call
    spreadsheet = SpreadsheetParser.open(file)
    return invalid_file_res unless spreadsheet

    sheet = spreadsheet.sheet(0)
    return empty_file_res if sheet.last_row.nil? || sheet.last_row < 2

    process_sheet(sheet)
  end

  private

  attr_reader :shop, :file, :packages_map
  attr_accessor :success_count, :errors, :current_count

  def invalid_file_res
    Result.new(
      total_rows: 0, success_count: 0, failed_count: 1,
      errors: [{ row: 0, customer_name: '-', phone: '-', error: INVALID_FILE_MSG }]
    )
  end

  def empty_file_res
    Result.new(total_rows: 0, success_count: 0, failed_count: 0, errors: [])
  end

  def process_sheet(sheet)
    col_indexes = SpreadsheetParser.find_column_indexes(sheet.row(1))
    total_rows = 0

    (2..sheet.last_row).each do |line_num|
      row = sheet.row(line_num)
      next if row_blank?(row)

      total_rows += 1
      process_row(line_num, row, col_indexes)
    end

    Result.new(total_rows: total_rows, success_count: success_count, failed_count: errors.length, errors: errors)
  end

  def row_blank?(row)
    row.nil? || row.all? { |cell| cell.to_s.strip.empty? }
  end

  def process_row(line_num, row, col_indexes)
    row_data = SpreadsheetParser.extract_row_data(row, col_indexes)
    row_errors = validate_row(row_data[:name], row_data[:phone], row_data[:pkg_name])

    if row_errors.any?
      record_error(line_num, row_data[:name], row_data[:phone], row_errors.join('; '))
    else
      create_member(line_num, row_data, row_data[:val_override])
    end
  end

  def validate_row(name, phone, pkg_name)
    errs = []
    errs << 'Tên hội viên không được để trống' if name.blank?
    errs << 'Số điện thoại không được để trống' if phone.blank?
    validate_pkg_and_quota(pkg_name, errs)
    errs
  end

  def validate_pkg_and_quota(pkg_name, errs)
    if pkg_name.blank?
      errs << 'Gói cước không được để trống'
    elsif !packages_map.key?(pkg_name.downcase)
      errs << "Gói cước '#{pkg_name}' không tồn tại"
    end

    return unless shop.plan == 'free' && current_count >= Membership::MAX_FREE_MEMBERSHIPS

    errs << QUOTA_EXCEEDED_MSG
  end

  def create_member(line_num, row_data, value_override)
    package = packages_map[row_data[:pkg_name].downcase]
    membership = shop.memberships.build(customer_name: row_data[:name], phone: row_data[:phone], package: package)
    membership.apply_package_init
    apply_value_override(membership, package, value_override)

    save_membership(membership, line_num, row_data)
  end

  def save_membership(membership, line_num, row_data)
    if membership.save
      self.success_count += 1
      self.current_count += 1
    else
      record_error(line_num, row_data[:name], row_data[:phone], membership.errors.full_messages.join('; '))
    end
  end

  def apply_value_override(membership, package, value_override)
    return if value_override.blank?

    if package.session_based? && value_override.match?(/^\d+$/)
      membership.sessions_left = value_override.to_i
    elsif package.day_based?
      parsed = SpreadsheetParser.parse_date(value_override)
      membership.expires_at = parsed if parsed
    end
  end

  def record_error(line_num, name, phone, msg)
    errors << { row: line_num, customer_name: name.presence || '-', phone: phone.presence || '-', error: msg }
  end

  # Inner helper class for spreadsheet parsing and date conversion
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
end
