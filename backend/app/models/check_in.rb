class CheckIn < ApplicationRecord
  belongs_to :membership
  belongs_to :staff
end
