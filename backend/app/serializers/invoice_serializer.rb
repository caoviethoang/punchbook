# frozen_string_literal: true

# Responsible for converting an Invoice into a JSON-safe hash.
class InvoiceSerializer
  def initialize(invoice)
    @invoice = invoice
  end

  def as_api_json
    invoice.as_json(
      only: %i[id amount status payos_transaction_id payos_checkout_url created_at],
      include: {
        membership: {
          only: %i[id customer_name phone]
        }
      }
    )
  end

  private

  attr_reader :invoice
end
