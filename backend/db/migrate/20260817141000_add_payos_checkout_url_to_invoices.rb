# frozen_string_literal: true

class AddPayosCheckoutUrlToInvoices < ActiveRecord::Migration[8.1]
  def change
    add_column :invoices, :payos_checkout_url, :string
  end
end
