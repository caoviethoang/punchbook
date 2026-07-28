# frozen_string_literal: true

class Package < ApplicationRecord
  belongs_to :shop
  has_many :memberships, dependent: :destroy
end
