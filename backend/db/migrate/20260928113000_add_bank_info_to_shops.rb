# frozen_string_literal: true

class AddBankInfoToShops < ActiveRecord::Migration[8.1]
  def change
    change_table :shops, bulk: true do |t|
      t.string :bank_name
      t.string :bank_account_no
      t.string :bank_account_name
    end
  end
end
