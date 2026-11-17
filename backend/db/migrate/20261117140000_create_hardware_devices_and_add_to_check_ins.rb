# frozen_string_literal: true

class CreateHardwareDevicesAndAddToCheckIns < ActiveRecord::Migration[8.0]
  def change
    create_table :hardware_devices, id: :uuid, default: -> { 'gen_random_uuid()' } do |t|
      t.references :shop, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false
      t.string :device_token, null: false
      t.string :device_type, null: false, default: 'turnstile'
      t.string :location
      t.datetime :last_ping_at
      t.boolean :is_active, null: false, default: true

      t.timestamps
    end

    add_index :hardware_devices, :device_token, unique: true
    add_index :hardware_devices, %i[shop_id device_type]
    add_index :hardware_devices, %i[shop_id last_ping_at]

    add_reference :check_ins, :hardware_device, type: :uuid, foreign_key: { on_delete: :nullify }, index: true, null: true
  end
end
