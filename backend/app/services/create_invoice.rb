# frozen_string_literal: true

# Creates a pending Invoice for a shop membership and requests a payOS payment link.
class CreateInvoice
  DEFAULT_DESCRIPTION = 'PunchBook'

  def self.call(shop:, membership_id:, params: {})
    new(shop: shop, membership_id: membership_id, params: params).call
  end

  def initialize(shop:, membership_id:, params:)
    @shop = shop
    @membership_id = membership_id
    @params = params
  end

  # Returns [invoice, payos_result]
  def call
    invoice = build_invoice
    [invoice, persist_with_payos(invoice)]
  end

  private

  attr_reader :shop, :membership_id, :params

  def membership
    @membership ||= shop.memberships.includes(:package).find(membership_id)
  end

  def build_invoice
    membership.invoices.build(
      amount: params[:amount].presence || membership.package.price,
      status: 'pending'
    )
  end

  def persist_with_payos(invoice)
    Invoice.transaction do
      invoice.save!
      payos = create_payos_link(invoice)
      invoice.update!(payos_transaction_id: payos.payment_link_id, payos_checkout_url: payos.checkout_url)
      payos
    end
  end

  def create_payos_link(invoice)
    PayosService.create_payment_link(
      order_code: invoice.id,
      amount: invoice.amount,
      description: (params[:description].presence || DEFAULT_DESCRIPTION).to_s[0..8],
      cancel_url: params[:cancel_url].presence || default_url('cancel'),
      return_url: params[:return_url].presence || default_url('success')
    )
  end

  def default_url(status)
    "https://punchbook.vn/memberships/#{membership.id}/#{status}"
  end
end
