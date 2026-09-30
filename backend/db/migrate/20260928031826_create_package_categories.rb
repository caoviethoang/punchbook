# frozen_string_literal: true

class CreatePackageCategories < ActiveRecord::Migration[8.1]
  def change
    create_table :package_categories, id: :uuid do |t|
      t.references :shop, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false

      t.timestamps
    end

    add_index :package_categories, [:shop_id, :name], unique: true
    add_reference :packages, :package_category, foreign_key: true, type: :uuid, null: true
  end
end
