# frozen_string_literal: true

require 'caxlsx'

# Service to generate an Excel (.xlsx) file containing a filtered list of memberships.
class ExportMembershipsService
  HEADERS = [
    'Tên hội viên',
    'SĐT',
    'Gói cước',
    'Số buổi còn lại',
    'Ngày hết hạn',
    'Trạng thái'
  ].freeze

  ROW_TYPES = [:string, :string, :string, nil, :string, :string].freeze

  STATUS_MAPPINGS = {
    'dang_hoat_dong' => 'active',
    'sap_het_han' => 'expiring',
    'da_het_han' => 'expired',
    'tat_ca' => 'all'
  }.freeze

  def self.call(shop:, query: nil, status: nil)
    new(shop: shop, query: query, status: status).call
  end

  def initialize(shop:, query: nil, status: nil)
    @shop = shop
    @query = query
    @status = status
  end

  def call
    package = Axlsx::Package.new
    workbook = package.workbook

    workbook.add_worksheet(name: 'Danh sách hội viên') do |sheet|
      sheet.add_row HEADERS
      memberships.each do |membership|
        sheet.add_row membership_row(membership), types: ROW_TYPES
      end
    end

    package.to_stream.read
  end

  private

  attr_reader :shop, :query, :status

  def memberships
    scope = shop.memberships.includes(:package).order(:customer_name)
    scope = scope.search_by_query(query) if query.present?
    normalized = normalize_status(status)
    scope = scope.by_status(normalized) if normalized.present?
    scope
  end

  def membership_row(membership)
    [
      membership.customer_name,
      membership.phone,
      membership.package&.name || 'Không rõ',
      format_sessions_left(membership),
      format_expires_at(membership),
      membership_status_label(membership.status)
    ]
  end

  def format_sessions_left(membership)
    return membership.sessions_left if membership.sessions_left.present?
    return 0 if membership.package&.session_based?

    'Theo ngày'
  end

  def format_expires_at(membership)
    membership.expires_at ? membership.expires_at.strftime('%d/%m/%Y') : 'Không giới hạn'
  end

  def membership_status_label(status)
    case status
    when 'active' then 'Đang hoạt động'
    when 'expiring' then 'Sắp hết hạn'
    when 'expired' then 'Đã hết hạn'
    else status.to_s
    end
  end

  def normalize_status(raw_status)
    val = raw_status.to_s.strip.downcase
    STATUS_MAPPINGS[val] || val
  end
end
