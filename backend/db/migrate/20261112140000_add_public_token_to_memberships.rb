# frozen_string_literal: true

class AddPublicTokenToMemberships < ActiveRecord::Migration[8.1]
  class MigrationMembership < ActiveRecord::Base
    self.table_name = 'memberships'
  end

  def up
    add_column :memberships, :public_token, :string

    MigrationMembership.reset_column_information
    MigrationMembership.find_each do |membership|
      membership.update!(public_token: SecureRandom.urlsafe_base64(24))
    end

    change_column_null :memberships, :public_token, false
    add_index :memberships, :public_token, unique: true
  end

  def down
    remove_index :memberships, :public_token
    remove_column :memberships, :public_token
  end
end
