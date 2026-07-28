# frozen_string_literal: true

class AddDeviseToShops < ActiveRecord::Migration[8.1]
  def up
    change_table :shops, bulk: true do |t|
      t.string :email
      t.string :encrypted_password, null: false, default: ''
    end

    backfill_devise_columns
    change_column_null :shops, :email, false
    add_index :shops, :email, unique: true
  end

  def down
    remove_index :shops, :email
    change_table :shops, bulk: true do |t|
      t.remove :encrypted_password
      t.remove :email
    end
  end

  private

  # Existing rows get temporary credentials so the table stays usable.
  # Re-seed or reset passwords in real environments after migrate.
  def backfill_devise_columns
    digest = connection.quote(Devise::Encryptor.digest(Shop, 'password123'))

    execute <<~SQL.squish
      UPDATE shops
      SET
        email = COALESCE(NULLIF(email, ''), 'shop-' || id::text || '@example.com'),
        encrypted_password = CASE
          WHEN encrypted_password IS NULL OR encrypted_password = '' THEN #{digest}
          ELSE encrypted_password
        END
    SQL
  end
end
