class AddAuthToStaffs < ActiveRecord::Migration[8.1]
  def change
    add_column :staffs, :username, :string
    add_column :staffs, :password_digest, :string

    add_index :staffs, %i[shop_id username], unique: true, where: 'username IS NOT NULL'
  end
end
