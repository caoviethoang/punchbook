# frozen_string_literal: true

class AddStatusToMemberships < ActiveRecord::Migration[8.1]
  def up
    add_column :memberships, :status, :string, default: 'active', null: false
    add_index :memberships, %i[shop_id status]

    execute <<~SQL
      UPDATE memberships
      SET status = CASE
        WHEN sessions_left IS NOT NULL AND sessions_left <= 0 THEN 'expired'
        WHEN sessions_left IS NOT NULL AND sessions_left <= 3 THEN 'expiring'
        WHEN expires_at IS NOT NULL AND expires_at < CURRENT_DATE THEN 'expired'
        WHEN expires_at IS NOT NULL AND expires_at <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring'
        ELSE 'active'
      END;
    SQL
  end

  def down
    remove_index :memberships, %i[shop_id status]
    remove_column :memberships, :status
  end
end
