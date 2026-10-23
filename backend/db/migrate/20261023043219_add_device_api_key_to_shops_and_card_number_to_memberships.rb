# frozen_string_literal: true

class AddDeviceApiKeyToShopsAndCardNumberToMemberships < ActiveRecord::Migration[8.1]
  def change
    add_column :shops, :device_api_key, :string
    add_index :shops, :device_api_key, unique: true

    add_column :memberships, :card_number, :string
    add_index :memberships, %i[shop_id card_number], unique: true, where: 'card_number IS NOT NULL'
  end
end
