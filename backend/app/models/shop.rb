# frozen_string_literal: true

class Shop < ApplicationRecord
  has_many :staffs, dependent: :destroy
  has_many :packages, dependent: :destroy
  has_many :memberships, dependent: :destroy
end
