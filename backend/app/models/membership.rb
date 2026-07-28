# frozen_string_literal: true

class Membership < ApplicationRecord
  belongs_to :shop
  belongs_to :package
  has_many :check_ins, dependent: :destroy
  has_many :invoices, dependent: :destroy
  validates :sessions_left, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
end
