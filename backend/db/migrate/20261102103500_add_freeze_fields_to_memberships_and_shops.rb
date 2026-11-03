# frozen_string_literal: true

class AddFreezeFieldsToMembershipsAndShops < ActiveRecord::Migration[8.1]
  def change
    change_table :memberships, bulk: true do |t|
      t.datetime :frozen_at
      t.date :frozen_until
      t.string :freeze_reason
      t.index %i[shop_id frozen_until]
    end

    add_column :shops, :max_freeze_days_per_year, :integer, default: 30, null: false
  end
end
