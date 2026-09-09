# frozen_string_literal: true

require 'caxlsx'

# Service to generate a multi-sheet Excel report for a paid shop.
# Sheets:
# 1. Doanh thu (Invoices)
# 2. Danh sách hội viên (Memberships)
# 3. Lịch sử điểm danh (Check-ins)
class ExcelReportGenerator
  def self.call(shop:)
    new(shop: shop).call
  end

  def initialize(shop:)
    @shop = shop
  end

  def call
    package = Axlsx::Package.new
    workbook = package.workbook

    add_invoices_sheet(workbook)
    add_memberships_sheet(workbook)
    add_check_ins_sheet(workbook)

    package.to_stream.read
  end

  private

  attr_reader :shop

  # rubocop:disable Metrics/MethodLength, Metrics/AbcSize
  def add_invoices_sheet(workbook)
    workbook.add_worksheet(name: 'Doanh thu') do |sheet|
      sheet.add_row [
        'Mã hoá đơn', 'Ngày tạo', 'Khách hàng', 'Gói dịch vụ',
        'Số tiền (VND)', 'Trạng thái', 'Mã giao dịch payOS'
      ]

      invoices.each do |invoice|
        sheet.add_row [
          invoice.id,
          invoice.created_at.strftime('%d/%m/%Y %H:%M'),
          invoice.membership.customer_name,
          invoice.membership.package.name,
          invoice.amount,
          invoice.status == 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán',
          invoice.payos_transaction_id || '-'
        ]
      end
    end
  end

  def add_memberships_sheet(workbook)
    workbook.add_worksheet(name: 'Hội viên') do |sheet|
      sheet.add_row ['Tên khách hàng', 'Số điện thoại', 'Gói dịch vụ', 'Buổi còn lại', 'Ngày hết hạn', 'Trạng thái']

      memberships.each do |m|
        sheet.add_row [
          m.customer_name,
          m.phone,
          m.package.name,
          m.sessions_left.presence || 'Theo ngày',
          m.expires_at ? m.expires_at.strftime('%d/%m/%Y') : 'Không giới hạn',
          membership_status_label(m.status)
        ]
      end
    end
  end

  def add_check_ins_sheet(workbook)
    workbook.add_worksheet(name: 'Lịch sử check-in') do |sheet|
      sheet.add_row ['Thời gian', 'Khách hàng', 'Số điện thoại', 'Gói dịch vụ', 'Nhân viên']

      check_ins.each do |c|
        sheet.add_row [
          c.checked_in_at&.strftime('%d/%m/%Y %H:%M') || c.created_at.strftime('%d/%m/%Y %H:%M'),
          c.membership.customer_name,
          c.membership.phone,
          c.membership.package.name,
          c.staff&.name || '-'
        ]
      end
    end
  end
  # rubocop:enable Metrics/MethodLength, Metrics/AbcSize

  def invoices
    Invoice.joins('INNER JOIN memberships ON memberships.id = invoices.membership_id')
           .where(memberships: { shop_id: shop.id })
           .includes(membership: :package)
           .order(created_at: :desc)
  end

  def memberships
    shop.memberships.with_discarded.includes(:package).order(created_at: :desc)
  end

  def check_ins
    CheckIn.joins('INNER JOIN memberships ON memberships.id = check_ins.membership_id')
           .where(memberships: { shop_id: shop.id })
           .includes(:staff, membership: :package)
           .order(created_at: :desc)
  end

  def membership_status_label(status)
    case status
    when 'active' then 'Đang hoạt động'
    when 'expiring' then 'Sắp hết hạn'
    when 'expired' then 'Đã hết hạn'
    else status
    end
  end
end
