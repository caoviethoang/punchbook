# frozen_string_literal: true

# rubocop:disable Metrics/MethodLength, Rails/BulkChangeTable
class AddKioskFieldsToShops < ActiveRecord::Migration[8.1]
  def change
    add_column :shops, :kiosk_enabled, :boolean, default: false, null: false
    add_column :shops, :kiosk_pin, :string, default: '1234'
    add_column :shops, :kiosk_welcome_message, :string, default: 'Chào mừng bạn đến với phòng tập!'
    add_column :shops, :kiosk_audio_enabled, :boolean, default: true, null: false
    add_column :shops, :kiosk_token, :string

    add_index :shops, :kiosk_token, unique: true

    reversible do |dir|
      dir.up do
        # Generate initial kiosk_token for existing shops
        execute <<~SQL.squish
          UPDATE shops
          SET kiosk_token = 'pb_kiosk_' || md5(random()::text || clock_timestamp()::text)
          WHERE kiosk_token IS NULL
        SQL
      end
    end
  end
end
# rubocop:enable Metrics/MethodLength, Rails/BulkChangeTable
