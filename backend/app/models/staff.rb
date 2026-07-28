class Staff < ApplicationRecord
  belongs_to :shop
  has_many :check_ins
end
