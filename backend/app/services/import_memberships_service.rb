# frozen_string_literal: true

require 'roo'

# Service object to parse Excel/CSV files and import memberships into a shop.
# rubocop:disable Metrics/ClassLength
class ImportMembershipsService
  Result = Struct.new(:total_rows, :success_count, :failed_count, :errors, keyword_init: true)

  INVALID_FILE_MSG = 'Định dạng file không hợp lệ. Chỉ chấp nhận .xlsx, .xls hoặc .csv'
  QUOTA_EXCEEDED_MSG = 'Gói Free chỉ được tạo tối đa 15 hội viên. Vui lòng nâng cấp gói trả phí.'

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

  def self.call(shop:, file:)
    new(shop: shop, file: file).call
  end

  def initialize(shop:, file:)
    @shop = shop
    @file = file
    @success_count = 0
    @errors = []
    @current_memberships_count = shop.memberships.count
    @packages_map = shop.packages.index_by { |p| p.name.strip.downcase }
  end

  def call
    spreadsheet = open_spreadsheet
    return invalid_file_result unless spreadsheet

    sheet = spreadsheet.sheet(0)
    return empty_file_result if sheet.last_row.nil? || sheet.last_row < 2

    process_sheet(sheet)
  end

  private

  attr_reader :shop, :file, :packages_map
  attr_accessor :success_count, :errors, :current_memberships_count

  def open_spreadsheet
    path, ext = extract_file_path_and_ext
    ROO_READERS[ext]&.call(path)
  rescue StandardError => e
    Rails.logger.error("Spreadsheet open error: #{e.message}")
    nil
  end

  def extract_file_path_and_ext
    path = file.respond_to?(:path) ? file.path : file.to_s
    filename = file.respond_to?(:original_filename) ? file.original_filename : path
    [path, File.extname(filename).downcase]
  end

  def invalid_file_result
    Result.new(
      total_rows: 0, success_count: 0, failed_count: 1,
      errors: [{ row: 0, customer_name: '-', phone: '-', error: INVALID_FILE_MSG }]
    )
  end

  def empty_file_result
    Result.new(total_rows: 0, success_count: 0, failed_count: 0, errors: [])
  end

  def process_sheet(sheet)
    col_indexes = find_column_indexes(sheet.row(1))
    total_rows = 0

    (2..sheet.last_row).each do |line_num|
      row = sheet.row(line_num)
      next if row_blank?(row)

      total_rows += 1
      process_row(line_num, row, col_indexes)
    end

    Result.new(total_rows: total_rows, success_count: success_count, failed_count: errors.length, errors: errors)
  end

  def find_column_indexes(header_row)
    idx = { name: 0, phone: 1, pkg: 2, val: 3 }
    header_row.each_with_index do |col, col_index|
      val = col.to_s.strip
      HEADER_PATTERNS.each do |key, pattern|
        idx[key] = col_index if val.match?(pattern)
      end
    end
    [idx[:name], idx[:phone], idx[:pkg], idx[:val]]
  end

  def row_blank?(row)
    row.nil? || row.all? { |cell| cell.to_s.strip.empty? }
  end

  def extract_row_data(row, col_indexes)
    [
      row[col_indexes[0]].to_s.strip,
      clean_phone(row[col_indexes[1]]),
      row[col_indexes[2]].to_s.strip,
      row[col_indexes[3]].to_s.strip
    ]
  end

  def process_row(line_num, row, col_indexes)
    name, phone, pkg_name, val_override = extract_row_data(row, col_indexes)
    row_errors = validate_row(name, phone, pkg_name)

    if row_errors.any?
      record_error(line_num: line_num, name: name, phone: phone, msg: row_errors.join('; '))
    else
      create_member(line_num: line_num, name: name, phone: phone, package: packages_map[pkg_name.downcase],
                    value_override: val_override)
    end
  end

  def clean_phone(val)
    raw = val.to_s.strip
    return '' if raw.blank?

    raw = raw.sub(/\.0$/, '')
    raw.match?(/^\d{9}$/) ? "0#{raw}" : raw
  end

  def validate_row(name, phone, pkg_name)
    row_errors = []
    row_errors << 'Tên hội viên không được để trống' if name.blank?
    row_errors << 'Số điện thoại không được để trống' if phone.blank?
    validate_package(pkg_name, row_errors)
    validate_quota(row_errors)
    row_errors
  end

  def validate_package(pkg_name, row_errors)
    if pkg_name.blank?
      row_errors << 'Gói cước không được để trống'
    elsif !packages_map.key?(pkg_name.downcase)
      row_errors << "Gói cước '#{pkg_name}' không tồn tại"
    end
  end

  def validate_quota(row_errors)
    return unless shop.plan == 'free' && current_memberships_count >= Membership::MAX_FREE_MEMBERSHIPS

    row_errors << QUOTA_EXCEEDED_MSG
  end

  def create_member(line_num:, name:, phone:, package:, value_override:)
    m = shop.memberships.build(customer_name: name, phone: phone, package: package)
    m.apply_package_init
    apply_value_override(membership: m, package: package, value_override: value_override)

    if m.save
      self.success_count += 1
      self.current_memberships_count += 1
    else
      record_error(line_num: line_num, name: name, phone: phone, msg: m.errors.full_messages.join('; '))
    end
  end

  def apply_value_override(membership:, package:, value_override:)
    return if value_override.blank?

    if package.session_based? && value_override.match?(/^\d+$/)
      membership.sessions_left = value_override.to_i
    elsif package.day_based?
      parsed_date = parse_override_date(value_override)
      membership.expires_at = parsed_date if parsed_date
    end
  end

  def parse_override_date(val)
    return val.to_date if val.respond_to?(:to_date)

    Date.strptime(val, '%d/%m/%Y')
  rescue ArgumentError, TypeError
    try_parse_date(val)
  end

  def try_parse_date(val)
    Date.parse(val)
  rescue ArgumentError, TypeError
    nil
  end

  def record_error(line_num:, name:, phone:, msg:)
    errors << { row: line_num, customer_name: name.presence || '-', phone: phone.presence || '-', error: msg }
  end
end
# rubocop:enable Metrics/ClassLength
