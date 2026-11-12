# frozen_string_literal: true

class AddPtAndTrainerCommissions < ActiveRecord::Migration[8.1]
  def change
    add_column :memberships, :assigned_staff_id, :uuid
    add_index :memberships, :assigned_staff_id
    add_foreign_key :memberships, :staffs, column: :assigned_staff_id, on_delete: :nullify

    add_column :check_ins, :trainer_id, :uuid
    add_index :check_ins, :trainer_id
    add_foreign_key :check_ins, :staffs, column: :trainer_id, on_delete: :nullify

    add_column :packages, :pt_package, :boolean, default: false, null: false
    add_column :packages, :commission_type, :string, default: 'flat', null: false
    add_column :packages, :commission_rate, :integer, default: 0, null: false
    add_column :packages, :sale_commission_rate, :integer, default: 0, null: false
  end
end

