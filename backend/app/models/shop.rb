# frozen_string_literal: true

class Shop < ApplicationRecord
  has_many :staffs
  has_many :packages
  has_many :memberships
end
