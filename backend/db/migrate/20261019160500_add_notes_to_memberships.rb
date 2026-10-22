# frozen_string_literal: true

class AddNotesToMemberships < ActiveRecord::Migration[8.0]
  def change
    add_column :memberships, :notes, :text
  end
end
