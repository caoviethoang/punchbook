# frozen_string_literal: true

class AddDurationDaysToPackages < ActiveRecord::Migration[8.1]
  def change
    add_column :packages, :duration_days, :integer
  end
end
