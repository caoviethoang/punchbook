# frozen_string_literal: true

class AddMultiChannelNotifications < ActiveRecord::Migration[8.1]
  def change
    add_column :memberships, :email, :string
    add_index :memberships, %i[shop_id email]

    change_table :shops, bulk: true do |t|
      t.boolean :email_notifications_enabled, default: true, null: false
      t.boolean :sms_notifications_enabled, default: false, null: false
      t.boolean :zalo_notifications_enabled, default: true, null: false
    end

    create_table :notification_logs, id: :uuid, default: -> { 'gen_random_uuid()' } do |t|
      t.references :shop, type: :uuid, null: false, foreign_key: true
      t.references :membership, type: :uuid, null: true, foreign_key: true
      t.string :channel, null: false
      t.string :event_type, null: false
      t.string :recipient, null: false
      t.string :status, default: 'sent', null: false
      t.text :error_message
      t.jsonb :metadata, default: {}, null: false
      t.datetime :sent_at

      t.timestamps
    end

    add_index :notification_logs, %i[shop_id created_at]
    add_index :notification_logs, %i[membership_id created_at]
    add_index :notification_logs, %i[shop_id channel status]
  end
end
