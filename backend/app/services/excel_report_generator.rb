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

  def add_invoices_sheet(workbook)
    workbook.add_worksheet(name: 'Doanh thu') do |sheet|
      sheet.add_row [
        'Mã hoá đơn', 'Ngày tạo', 'Khách hàng', 'Gói dịch vụ',
        'Số tiền (VND)', 'Trạng thái', 'Mã giao dịch payOS'
      ]

      invoices.each { |invoice| sheet.add_row invoice_row(invoice) }
    end
  end

  def add_memberships_sheet(workbook)
    workbook.add_worksheet(name: 'Hội viên') do |sheet|
      sheet.add_row ['Tên khách hàng', 'Số điện thoại', 'Gói dịch vụ', 'Buổi còn lại', 'Ngày hết hạn', 'Trạng thái']

      memberships.each { |m| sheet.add_row membership_row(m) }
    end
  end

  def add_check_ins_sheet(workbook)
    workbook.add_worksheet(name: 'Lịch sử check-in') do |sheet|
      sheet.add_row ['Thời gian', 'Khách hàng', 'Số điện thoại', 'Gói dịch vụ', 'Nhân viên']

      check_ins.each { |c| sheet.add_row check_in_row(c) }
    end
  end

  def invoice_row(invoice)
    [
      invoice.id,
      invoice.created_at.strftime('%d/%m/%Y %H:%M'),
      invoice.membership.customer_name,
      invoice.membership.package.name,
      invoice.amount,
      invoice.status == 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán',
      invoice.payos_transaction_id || '-'
    ]
  end

  def membership_row(membership)
    [
      membership.customer_name,
      membership.phone,
      membership.package.name,
      membership.sessions_left.presence || 'Theo ngày',
      membership.expires_at ? membership.expires_at.strftime('%d/%m/%Y') : 'Không giới hạn',
      membership_status_label(membership.status)
    ]
  end

  def check_in_row(check_in)
    [
      check_in_time(check_in),
      check_in.membership.customer_name,
      check_in.membership.phone,
      check_in.membership.package.name,
      check_in.staff&.name || '-'
    ]
  end

  def check_in_time(check_in)
    time = check_in.checked_in_at || check_in.created_at
    time.strftime('%d/%m/%Y %H:%M')
  end

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
