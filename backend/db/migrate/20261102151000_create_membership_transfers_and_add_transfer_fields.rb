# frozen_string_literal: true

# rubocop:disable Metrics/MethodLength, Metrics/AbcSize
class CreateMembershipTransfersAndAddTransferFields < ActiveRecord::Migration[8.1]
  def change
    change_table :memberships, bulk: true do |t|
      t.datetime :transferred_at
      t.references :transferred_to_membership, type: :uuid, foreign_key: { to_table: :memberships }, index: true
      t.references :transferred_from_membership, type: :uuid, foreign_key: { to_table: :memberships }, index: true
    end

    create_table :membership_transfers, id: :uuid, default: -> { 'gen_random_uuid()' } do |t|
      t.references :shop, type: :uuid, null: false, foreign_key: true
      t.references :source_membership, type: :uuid, null: false, foreign_key: { to_table: :memberships }
      t.references :target_membership, type: :uuid, null: false, foreign_key: { to_table: :memberships }
      t.references :staff, type: :uuid, foreign_key: true
      t.references :invoice, type: :uuid, foreign_key: true
      t.integer :sessions_transferred
      t.integer :days_transferred
      t.integer :fee, default: 0, null: false
      t.string :note

      t.timestamps
    end

    add_index :membership_transfers, %i[shop_id created_at]
  end
end
# rubocop:enable Metrics/MethodLength, Metrics/AbcSize
