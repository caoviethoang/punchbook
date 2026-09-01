# frozen_string_literal: true

require 'roo'
require 'csv'

# Service to import memberships from Excel (.xlsx, .xls) or CSV (.csv) files.
# rubocop:disable Metrics/ClassLength
class ImportMemberships
  REQUIRED_HEADERS = %i[customer_name phone package_name].freeze

  def self.call(shop:, file:)
    new(shop: shop, file: file).call
  end

  def initialize(shop:, file:)
    @shop = shop
    @file = file
    @errors = []
    @imported_memberships = []
  end

  # rubocop:disable Metrics/MethodLength, Metrics/AbcSize, Metrics/CyclomaticComplexity
  def call
    rows = extract_rows_from_file
    return error_result('File không có dữ liệu hoặc không đọc được.') if rows.blank?

    header_row_idx, col_map = detect_headers(rows)
    if col_map.blank? || !REQUIRED_HEADERS.all? { |h| col_map.key?(h) }
      return error_result(
        'File không đúng định dạng. Cần có các cột tiêu đề: Tên hội viên, Số điện thoại, Gói cước.'
      )
    end

    data_rows = rows[(header_row_idx + 1)..]
    data_rows.each_with_index do |row, idx|
      actual_row_num = header_row_idx + idx + 2
      process_row(row, actual_row_num, col_map)
    end

    {
      success: errors.empty?,
      total_rows: data_rows.count { |r| row_has_content?(r) },
      success_count: imported_memberships.size,
      error_count: errors.size,
      errors: errors,
      memberships: imported_memberships.map(&:as_api_json)
    }
  end
  # rubocop:enable Metrics/MethodLength, Metrics/AbcSize, Metrics/CyclomaticComplexity

  private

  attr_reader :shop, :file, :errors, :imported_memberships

  def error_result(message)
    {
      success: false,
      total_rows: 0,
      success_count: 0,
      error_count: 1,
      errors: [{ row: 1, customer_name: nil, phone: nil, package_name: nil, message: message }],
      memberships: []
    }
  end

  # rubocop:disable Metrics/MethodLength, Metrics/AbcSize, Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity
  def process_row(row, row_num, col_map)
    return unless row_has_content?(row)

    raw_name = clean_string(row[col_map[:customer_name]])
    raw_phone = clean_string(row[col_map[:phone]])
    raw_package = clean_string(row[col_map[:package_name]])
    raw_sessions = col_map[:sessions_left] ? row[col_map[:sessions_left]] : nil
    raw_expires = col_map[:expires_at] ? row[col_map[:expires_at]] : nil

    if raw_name.blank?
      record_error(row_num, raw_name, raw_phone, raw_package, 'Tên hội viên không được để trống.')
      return
    end

    if raw_phone.blank?
      record_error(row_num, raw_name, raw_phone, raw_package, 'Số điện thoại không được để trống.')
      return
    end

    normalized_phone = normalize_phone(raw_phone)
    if normalized_phone.blank? || normalized_phone.length < 8 || normalized_phone.length > 15
      record_error(row_num, raw_name, raw_phone, raw_package, 'Số điện thoại không hợp lệ (cần từ 8 đến 15 số).')
      return
    end

    if raw_package.blank?
      record_error(row_num, raw_name, raw_phone, raw_package, 'Gói cước không được để trống.')
      return
    end

    package = find_package(raw_package)
    unless package
      record_error(row_num, raw_name, raw_phone, raw_package,
                   "Gói cước '#{raw_package}' không tồn tại trong hệ thống cửa hàng.")
      return
    end

    sessions_left, expires_at, calc_err = calculate_sessions_and_expiry(package, raw_sessions, raw_expires)
    if calc_err
      record_error(row_num, raw_name, raw_phone, raw_package, calc_err)
      return
    end

    if free_plan_limit_reached?
      record_error(row_num, raw_name, raw_phone, raw_package,
                   'Gói Free chỉ được tạo tối đa 15 hội viên. Vui lòng nâng cấp gói trả phí để tạo thêm hội viên.')
      return
    end

    create_membership_record(row_num, raw_name, normalized_phone, package, sessions_left, expires_at)
  end
  # rubocop:enable Metrics/MethodLength, Metrics/AbcSize, Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity

  # rubocop:disable Metrics/MethodLength, Metrics/ParameterLists
  def create_membership_record(row_num, name, phone, package, sessions_left, expires_at)
    membership = shop.memberships.build(
      customer_name: name,
      phone: phone,
      package: package,
      sessions_left: sessions_left,
      expires_at: expires_at
    )

    if membership.save
      imported_memberships << membership
    else
      record_error(row_num, name, phone, package.name, membership.errors.full_messages.join(', '))
    end
  end
  # rubocop:enable Metrics/MethodLength, Metrics/ParameterLists

  # rubocop:disable Metrics/AbcSize, Metrics/MethodLength, Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity
  def calculate_sessions_and_expiry(package, raw_sessions, raw_expires)
    sessions_left = nil
    expires_at = nil

    if package.session_based?
      if raw_sessions.present?
        str_val = raw_sessions.to_s.strip.sub(/\.0+\z/, '')
        return [nil, nil, 'Số buổi còn lại phải là số nguyên không âm.'] if str_val !~ /\A\d+\z/

        sessions_left = str_val.to_i
      else
        sessions_left = package.sessions_count
      end

      if raw_expires.present?
        parsed = parse_date(raw_expires)
        if parsed == :invalid_date
          return [nil, nil,
                  "Ngày hết hạn '#{raw_expires}' không hợp lệ (hợp lệ: DD/MM/YYYY hoặc YYYY-MM-DD)."]
        end

        expires_at = parsed
      end
    elsif package.day_based?
      if raw_expires.present?
        parsed = parse_date(raw_expires)
        if parsed == :invalid_date
          return [nil, nil,
                  "Ngày hết hạn '#{raw_expires}' không hợp lệ (hợp lệ: DD/MM/YYYY hoặc YYYY-MM-DD)."]
        end

        expires_at = parsed
      else
        expires_at = Date.current + package.duration_days.days
      end
    end

    [sessions_left, expires_at, nil]
  end
  # rubocop:enable Metrics/AbcSize, Metrics/MethodLength, Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity

  def free_plan_limit_reached?
    return false unless shop.plan == 'free'

    shop.memberships.count >= Membership::MAX_FREE_MEMBERSHIPS
  end

  def find_package(name)
    target = name.strip.downcase
    shop.packages.find { |p| p.name.strip.downcase == target }
  end

  def record_error(row_num, customer_name, phone, package_name, message)
    errors << {
      row: row_num,
      customer_name: customer_name,
      phone: phone,
      package_name: package_name,
      message: message
    }
  end

  def row_has_content?(row)
    return false if row.blank?

    row.any? { |cell| cell.present? && cell.to_s.strip.present? }
  end

  def clean_string(val)
    val.to_s.strip.presence
  end

  def normalize_phone(raw)
    return '' if raw.blank?

    str = raw.to_s.strip.sub(/\.0+\z/, '')
    digits = str.gsub(/\D/, '')

    if digits.start_with?('84') && digits.length == 11
      "0#{digits[2..]}"
    elsif digits.length == 9 && !digits.start_with?('0')
      "0#{digits}"
    else
      digits
    end
  end

  # rubocop:disable Metrics/AbcSize, Metrics/MethodLength, Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity
  def parse_date(value)
    return nil if value.blank?
    return value.to_date if value.is_a?(Date) || value.is_a?(Time) || value.is_a?(DateTime)

    str = value.to_s.strip
    return nil if str.blank?

    if str =~ %r{\A(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\z}
      day, month, year = str.split(%r{[/.-]}).map(&:to_i)
      Date.new(year, month, day)
    elsif str =~ %r{\A(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})\z}
      year, month, day = str.split(%r{[/.-]}).map(&:to_i)
      Date.new(year, month, day)
    else
      Date.parse(str)
    end
  rescue ArgumentError
    :invalid_date
  end
  # rubocop:enable Metrics/AbcSize, Metrics/MethodLength, Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity

  # rubocop:disable Metrics/MethodLength
  def detect_headers(rows)
    rows.each_with_index do |row, r_idx|
      next unless row_has_content?(row)

      col_map = {}
      row.each_with_index do |cell, c_idx|
        normalized = cell.to_s.strip.downcase.gsub(/[_\s-]+/, ' ')
        col_type = match_header_column(normalized)
        col_map[col_type] = c_idx if col_type
      end

      return [r_idx, col_map] if REQUIRED_HEADERS.all? { |h| col_map.key?(h) }
    end
    [0, {}]
  end
  # rubocop:enable Metrics/MethodLength

  # rubocop:disable Metrics/MethodLength
  def match_header_column(header)
    case header
    when /tên hội viên|tên khách hàng|họ và tên|họ tên|customer name|customer|hội viên|khách hàng/i
      :customer_name
    when /số điện thoại|sđt|sdt|phone|phone number|mobile|telephone|so dien thoai/i
      :phone
    when /tên gói|gói cước|gói dịch vụ|gói|package name|package|goi cuoc|goi dich vu/i
      :package_name
    when /số buổi còn lại|buổi còn lại|số buổi|buổi|sessions left|sessions|remaining sessions|so buoi/i
      :sessions_left
    when /ngày hết hạn|hạn sử dụng|hết hạn|expires at|expiry date|expiration date|ngay het han|han su dung/i
      :expires_at
    end
  end
  # rubocop:enable Metrics/MethodLength

  def extract_rows_from_file
    path, original_filename = resolve_file_path_and_name
    return [] unless path && File.exist?(path)

    ext = File.extname(original_filename.presence || path).downcase
    if ext == '.csv'
      extract_csv_rows(path)
    else
      extract_excel_rows(path, ext)
    end
  rescue StandardError
    # Fallback to CSV parsing in case of ambiguity
    extract_csv_rows(path) rescue [] # rubocop:disable Style/RescueModifier
  end

  def extract_csv_rows(path)
    content = File.read(path, encoding: 'bom|utf-8')
    CSV.parse(content)
  end

  def extract_excel_rows(path, ext)
    spreadsheet = Roo::Spreadsheet.open(path, extension: ext.sub('.', ''))
    sheet = spreadsheet.sheet(0)
    sheet.to_a
  end

  # rubocop:disable Metrics/AbcSize
  def resolve_file_path_and_name
    if file.respond_to?(:tempfile) && file.tempfile.respond_to?(:path)
      [file.tempfile.path, file.original_filename]
    elsif file.is_a?(File) || file.is_a?(Tempfile)
      [file.path, File.basename(file.path)]
    elsif file.is_a?(String)
      [file, File.basename(file)]
    else
      [nil, nil]
    end
  end
  # rubocop:enable Metrics/AbcSize
end
# rubocop:enable Metrics/ClassLength
