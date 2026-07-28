# frozen_string_literal: true

class AddDefaultStatusToInvoices < ActiveRecord::Migration[8.1]
  def up
    execute <<~SQL.squish
      UPDATE invoices
      SET status = LOWER(status)
      WHERE status IS NOT NULL
    SQL

    change_column_null :invoices, :status, false, 'pending'
    change_column_default :invoices, :status, from: nil, to: 'pending'
  end

  def down
    change_column_default :invoices, :status, from: 'pending', to: nil
    change_column_null :invoices, :status, true
  end
end
