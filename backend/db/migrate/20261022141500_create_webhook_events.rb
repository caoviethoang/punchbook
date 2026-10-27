# frozen_string_literal: true

class CreateWebhookEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :webhook_events, id: :uuid, default: -> { 'gen_random_uuid()' } do |t|
      t.references :shop, foreign_key: true, type: :uuid, index: true
      t.string :source, null: false, default: 'payos'
      t.string :event_type, null: false, default: 'payment'
      t.bigint :order_code, index: true
      t.jsonb :payload, null: false, default: {}
      t.string :status, null: false, default: 'pending', index: true
      t.integer :attempts, null: false, default: 0
      t.integer :max_attempts, null: false, default: 5
      t.text :last_error
      t.datetime :processed_at
      t.datetime :failed_at

      t.timestamps
    end

    add_index :webhook_events, %i[shop_id status]
    add_index :webhook_events, %i[source order_code]
  end
end
