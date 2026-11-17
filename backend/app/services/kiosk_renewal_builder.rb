# frozen_string_literal: true

class KioskRenewalBuilder
  def self.call(shop:, membership:)
    new(shop: shop, membership: membership).call
  end

  def initialize(shop:, membership:)
    @shop = shop
    @membership = membership
  end

  def call
    invoice = find_or_create_renewal_invoice
    invoice_details(invoice).merge(
      bank_name: shop.bank_name,
      bank_account_no: shop.bank_account_no,
      bank_account_name: shop.bank_account_name,
      vietqr_url: build_vietqr_url(invoice),
      payos_checkout_url: invoice.payos_checkout_url
    )
  end

  private

  attr_reader :shop, :membership

  def invoice_details(invoice)
    {
      invoice_id: invoice.id,
      order_code: invoice.payos_order_code,
      amount: invoice.amount,
      package_name: membership.package.name
    }
  end

  def find_or_create_renewal_invoice
    pending = membership.invoices.where(status: 'pending').order(created_at: :desc).first
    return pending if pending.present? && pending.created_at > 2.hours.ago

    create_new_invoice
  end

  def create_new_invoice
    amount = membership.package.price || 0
    invoice, = CreateInvoice.call(
      shop: shop,
      membership_id: membership.id,
      params: { amount: amount, description: 'Gia han Kiosk' }
    )
    invoice
  rescue StandardError
    membership.invoices.create!(amount: amount, status: 'pending')
  end

  def build_vietqr_url(invoice)
    return nil if shop.bank_name.blank? || shop.bank_account_no.blank?

    base = "https://img.vietqr.io/image/#{shop.bank_name}-#{shop.bank_account_no}-compact2.png"
    query = vietqr_query_params(invoice).to_query
    "#{base}?#{query}"
  end

  def vietqr_query_params(invoice)
    memo = invoice.payos_order_code.presence || "PB #{membership.phone.to_s.last(6)}"
    {
      amount: invoice.amount,
      addInfo: memo,
      accountName: shop.bank_account_name
    }
  end
end
