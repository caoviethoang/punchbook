# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_07_28_073258) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "check_ins", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "checked_in_at"
    t.datetime "created_at", null: false
    t.uuid "membership_id", null: false
    t.uuid "staff_id", null: false
    t.datetime "updated_at", null: false
    t.index ["membership_id"], name: "index_check_ins_on_membership_id"
    t.index ["staff_id"], name: "index_check_ins_on_staff_id"
  end

  create_table "invoices", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.integer "amount"
    t.datetime "created_at", null: false
    t.uuid "membership_id", null: false
    t.string "payos_transaction_id"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["membership_id"], name: "index_invoices_on_membership_id"
  end

  create_table "memberships", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "customer_name"
    t.date "expires_at"
    t.uuid "package_id", null: false
    t.string "phone"
    t.integer "sessions_left"
    t.uuid "shop_id", null: false
    t.datetime "updated_at", null: false
    t.index ["package_id"], name: "index_memberships_on_package_id"
    t.index ["shop_id"], name: "index_memberships_on_shop_id"
  end

  create_table "packages", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "duration_days"
    t.string "name"
    t.integer "price"
    t.integer "sessions_count"
    t.uuid "shop_id", null: false
    t.datetime "updated_at", null: false
    t.index ["shop_id"], name: "index_packages_on_shop_id"
  end

  create_table "shops", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.string "phone"
    t.string "plan", default: "free", null: false
    t.datetime "updated_at", null: false
  end

  create_table "staffs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.string "role"
    t.uuid "shop_id", null: false
    t.datetime "updated_at", null: false
    t.index ["shop_id"], name: "index_staffs_on_shop_id"
  end

  add_foreign_key "check_ins", "memberships"
  add_foreign_key "check_ins", "staffs"
  add_foreign_key "invoices", "memberships"
  add_foreign_key "memberships", "packages"
  add_foreign_key "memberships", "shops"
  add_foreign_key "packages", "shops"
  add_foreign_key "staffs", "shops"
end
