# frozen_string_literal: true

class InvoicesController < ApiController
  def create
    membership = find_membership
    invoice = build_pending_invoice(membership)
    result = process_invoice_transaction(membership, invoice)

    render_created_invoice(invoice, result)
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Not found' }, status: :not_found
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
  rescue PayosService::Error, ActionController::ParameterMissing => e
    render json: { error: e.message }, status: :unprocessable_content
  end

  private

  def find_membership
    current_shop.memberships.includes(:package).find(params.expect(:membership_id))
  end

  def build_pending_invoice(membership)
    amount = invoice_params[:amount].presence || membership.package.price
    membership.invoices.build(amount: amount, status: 'pending')
  end

  def process_invoice_transaction(membership, invoice)
    Invoice.transaction do
      invoice.save!
      result = create_payos_link(membership, invoice)
      invoice.update!(payos_transaction_id: result.payment_link_id, payos_checkout_url: result.checkout_url)
      result
    end
  end

  def create_payos_link(membership, invoice)
    PayosService.create_payment_link(
      order_code: invoice.id,
      amount: invoice.amount,
      description: (invoice_params[:description].presence || 'PunchBook').to_s[0..8],
      cancel_url: invoice_params[:cancel_url].presence || default_url(membership, 'cancel'),
      return_url: invoice_params[:return_url].presence || default_url(membership, 'success')
    )
  end

  def default_url(membership, status)
    "https://punchbook.vn/memberships/#{membership.id}/#{status}"
  end

  def render_created_invoice(invoice, result)
    render json: {
      invoice: invoice.as_api_json,
      payos: { checkout_url: result.checkout_url, qr_code: result.qr_code }
    }, status: :created
  end

  def invoice_params
    params.fetch(:invoice, {}).permit(:amount, :cancel_url, :return_url, :description)
  end
end
