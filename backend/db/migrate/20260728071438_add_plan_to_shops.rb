# frozen_string_literal: true

class AddPlanToShops < ActiveRecord::Migration[8.1]
  def change
    add_column :shops, :plan, :string, null: false, default: 'free'
  end
end
