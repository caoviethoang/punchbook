# frozen_string_literal: true

class CreateAuditLogs < ActiveRecord::Migration[7.1]
  def change
    create_table :audit_logs, id: :uuid do |t|
      t.references :shop, type: :uuid, null: false, foreign_key: { on_delete: :cascade }
      t.references :staff, type: :uuid, null: true, foreign_key: { on_delete: :nullify }
      t.string :action, null: false
      t.string :target_type
      t.uuid :target_id
      t.jsonb :details, default: {}, null: false

      t.timestamps
    end

    add_index :audit_logs, [:shop_id, :created_at]
    add_index :audit_logs, [:shop_id, :action]
    add_index :audit_logs, [:shop_id, :staff_id]
  end
end
