# frozen_string_literal: true

class AddDiscardedAtToMembershipsAndPackages < ActiveRecord::Migration[8.1]
  def change
    add_column :memberships, :discarded_at, :datetime
    add_index :memberships, :discarded_at

    add_column :packages, :discarded_at, :datetime
    add_index :packages, :discarded_at
  end
end
