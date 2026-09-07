# frozen_string_literal: true

class AddIndexesToMemberships < ActiveRecord::Migration[8.1]
  def change
    add_index :memberships, %i[shop_id customer_name]
    add_index :memberships, %i[shop_id phone]
    add_index :memberships, %i[shop_id sessions_left]
    add_index :memberships, %i[shop_id expires_at]
  end
end
