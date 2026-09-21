# frozen_string_literal: true

class Staff < ApplicationRecord
  belongs_to :shop, inverse_of: :staffs
  has_many :check_ins, dependent: :destroy, inverse_of: :staff
  has_many :audit_logs, dependent: :nullify, inverse_of: :staff

  validates :name, :role, presence: true
end
