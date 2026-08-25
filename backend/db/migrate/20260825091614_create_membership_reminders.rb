# frozen_string_literal: true

class CreateMembershipReminders < ActiveRecord::Migration[8.1]
  def change
    create_table :membership_reminders, id: :uuid do |t|
      t.references :membership, null: false, foreign_key: true, type: :uuid
      t.datetime :sent_at, null: false
      t.string :reminder_type, null: false, default: 'expiring'

      t.timestamps
    end

    add_index :membership_reminders, %i[membership_id sent_at]
  end
end
