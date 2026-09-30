# frozen_string_literal: true

class AddPayosOrderCodeAndCreateShopPlanPayments < ActiveRecord::Migration[8.1]
  def change
    add_column :invoices, :payos_order_code, :bigint
    add_index :invoices, :payos_order_code, unique: true

    create_table :shop_plan_payments, id: :uuid, default: -> { 'gen_random_uuid()' } do |t|
      t.references :shop, null: false, foreign_key: true, type: :uuid
      t.bigint :payos_order_code, null: false
      t.integer :amount, null: false
      t.integer :months, null: false, default: 1
      t.string :status, null: false, default: 'pending'
      t.string :payos_checkout_url
      t.string :payos_transaction_id

      t.timestamps
    end

    add_index :shop_plan_payments, :payos_order_code, unique: true
    add_index :shop_plan_payments, %i[shop_id status]
  end
end
