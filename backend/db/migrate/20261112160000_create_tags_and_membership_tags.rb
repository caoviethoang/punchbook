# frozen_string_literal: true

class CreateTagsAndMembershipTags < ActiveRecord::Migration[8.0]
  def change
    create_table :tags, id: :uuid do |t|
      t.references :shop, type: :uuid, null: false, foreign_key: true
      t.string :name, null: false
      t.string :color, null: false, default: '#6366f1'

      t.timestamps
    end

    add_index :tags, %i[shop_id name], unique: true

    create_table :membership_tags, id: :uuid do |t|
      t.references :membership, type: :uuid, null: false, foreign_key: true
      t.references :tag, type: :uuid, null: false, foreign_key: true

      t.timestamps
    end

    add_index :membership_tags, %i[membership_id tag_id], unique: true
  end
end
