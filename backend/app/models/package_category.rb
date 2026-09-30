# frozen_string_literal: true

class PackageCategory < ApplicationRecord
  belongs_to :shop, inverse_of: :package_categories
  has_many :packages, dependent: :nullify, inverse_of: :package_category

  validates :name, presence: true, uniqueness: { scope: :shop_id, case_sensitive: false }
end
