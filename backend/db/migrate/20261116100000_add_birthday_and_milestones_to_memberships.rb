# frozen_string_literal: true

class AddBirthdayAndMilestonesToMemberships < ActiveRecord::Migration[8.1]
  def change
    add_column :memberships, :date_of_birth, :date
    add_column :memberships, :total_check_ins_count, :integer, default: 0, null: false

    add_index :memberships, :date_of_birth

    reversible do |dir|
      dir.up do
        execute <<-SQL.squish
          UPDATE memberships
          SET total_check_ins_count = (
            SELECT COUNT(*) FROM check_ins WHERE check_ins.membership_id = memberships.id
          )
        SQL
      end
    end
  end
end
