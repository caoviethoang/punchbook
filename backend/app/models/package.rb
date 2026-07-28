class Package < ApplicationRecord
  belongs_to :shop
  has_many :memberships
end
