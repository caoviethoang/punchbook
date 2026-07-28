# frozen_string_literal: true

class Membership < ApplicationRecord
  belongs_to :shop
  belongs_to :package
  has_many :check_ins
  has_many :invoices
  validates :sessions_left, numericality: { greater_than_or_equal_to: 0 }
end
