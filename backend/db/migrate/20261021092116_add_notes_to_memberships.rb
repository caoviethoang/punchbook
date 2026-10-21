# frozen_string_literal: true

class AddNotesToMemberships < ActiveRecord::Migration[8.1]
  def change
    add_column :memberships, :notes, :text unless column_exists?(:memberships, :notes)
  end
end
