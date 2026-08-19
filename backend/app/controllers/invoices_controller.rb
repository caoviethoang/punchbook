# frozen_string_literal: true

class InvoicesController < ApiController
  def create
    invoice, result = CreateInvoice.call(
      shop: current_shop,
      membership_id: params.expect(:membership_id),
      params: invoice_params
    )
    render_created(invoice, result)
  end

  private

  def render_created(invoice, result)
    render json: {
      invoice: invoice.as_api_json,
      payos: { checkout_url: result.checkout_url, qr_code: result.qr_code }
    }, status: :created
  end

  def invoice_params
    params.fetch(:invoice, {}).permit(:amount, :cancel_url, :return_url, :description)
  end
end
