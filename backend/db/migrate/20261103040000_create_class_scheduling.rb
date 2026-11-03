# frozen_string_literal: true

class CreateClassScheduling < ActiveRecord::Migration[8.1]
  def change
    create_table :class_types, id: :uuid do |t|
      t.references :shop, null: false, type: :uuid, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.string :color, null: false, default: '#6366f1'
      t.integer :default_capacity, null: false, default: 15
      t.integer :default_duration_minutes, null: false, default: 60
      t.timestamps
    end
    add_index :class_types, %i[shop_id name], unique: true
    create_table :class_schedules, id: :uuid do |t|
      t.references :shop, null: false, type: :uuid, foreign_key: true
      t.references :class_type, null: false, type: :uuid, foreign_key: true
      t.references :instructor, type: :uuid, foreign_key: { to_table: :staffs, on_delete: :nullify }
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.integer :max_capacity, null: false
      t.string :status, null: false, default: 'scheduled'
      t.string :credit_policy, null: false, default: 'attendance'
      t.integer :cancellation_hours, null: false, default: 2
      t.uuid :series_id
      t.timestamps
    end
    add_index :class_schedules, %i[shop_id starts_at]
    add_check_constraint :class_schedules, 'ends_at > starts_at', name: 'class_schedule_valid_time'
    add_check_constraint :class_schedules, 'max_capacity > 0', name: 'class_schedule_positive_capacity'
    create_table :class_bookings, id: :uuid do |t|
      t.references :class_schedule, null: false, type: :uuid, foreign_key: true
      t.references :membership, null: false, type: :uuid, foreign_key: true
      t.string :status, null: false, default: 'booked'
      t.datetime :queued_at, null: false
      t.datetime :checked_in_at
      t.boolean :credit_deducted, null: false, default: false
      t.datetime :promoted_at
      t.datetime :promotion_notified_at
      t.timestamps
    end
    add_index :class_bookings, %i[class_schedule_id membership_id], unique: true, name: 'unique_class_member'
    add_index :class_bookings, %i[class_schedule_id status queued_at], name: 'class_waitlist_order'
  end
end
