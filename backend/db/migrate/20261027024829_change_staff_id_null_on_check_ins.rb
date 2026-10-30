# frozen_string_literal: true

class ChangeStaffIdNullOnCheckIns < ActiveRecord::Migration[8.1]
  def change
    change_column_null :check_ins, :staff_id, true
  end
end
