# frozen_string_literal: true

class Staff < ApplicationRecord
  ROLES = %w[admin staff].freeze

  has_secure_password validations: false

  belongs_to :shop, inverse_of: :staffs
  has_many :check_ins, dependent: :destroy, inverse_of: :staff
  has_many :audit_logs, dependent: :nullify, inverse_of: :staff

  validates :name, :role, presence: true
  validates :role, inclusion: { in: ROLES }
  validates :username, uniqueness: { scope: :shop_id, allow_blank: true }, presence: true, if: :password_digest?

  def admin?
    role == 'admin'
  end
end
