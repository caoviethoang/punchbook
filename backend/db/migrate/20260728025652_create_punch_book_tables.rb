# frozen_string_literal: true

class CreatePunchBookTables < ActiveRecord::Migration[8.1]
  def change
    # shops
    create_table :shops, id: :uuid do |t|
      t.string :name
      t.string :phone

      t.timestamps
    end

    # staffs
    create_table :staffs, id: :uuid do |t|
      t.references :shop, null: false, foreign_key: true, type: :uuid
      t.string :name
      t.string :role

      t.timestamps
    end

    # packages
    create_table :packages, id: :uuid do |t|
      t.references :shop, null: false, foreign_key: true, type: :uuid
      t.string :name
      t.integer :sessions_count
      t.integer :price

      t.timestamps
    end

    # memberships
    create_table :memberships, id: :uuid do |t|
      t.references :shop, null: false, foreign_key: true, type: :uuid
      t.references :package, null: false, foreign_key: true, type: :uuid
      t.string :customer_name
      t.string :phone
      t.integer :sessions_left
      t.date :expires_at

      t.timestamps
    end

    # check_ins
    create_table :check_ins, id: :uuid do |t|
      t.references :membership, null: false, foreign_key: true, type: :uuid
      t.references :staff, null: false, foreign_key: true, type: :uuid
      t.datetime :checked_in_at

      t.timestamps
    end

    # invoices
    create_table :invoices, id: :uuid do |t|
      t.references :membership, null: false, foreign_key: true, type: :uuid
      t.integer :amount
      t.string :status
      t.string :payos_transaction_id

      t.timestamps
    end
  end
end
