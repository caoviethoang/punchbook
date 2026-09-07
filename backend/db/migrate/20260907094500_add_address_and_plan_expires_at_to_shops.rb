# frozen_string_literal: true

class AddAddressAndPlanExpiresAtToShops < ActiveRecord::Migration[8.1]
  def change
    add_column :shops, :address, :string
    add_column :shops, :plan_expires_at, :datetime
  end
end
