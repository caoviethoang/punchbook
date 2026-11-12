# frozen_string_literal: true

class Staff < ApplicationRecord
  ROLES = %w[admin staff trainer].freeze

  has_secure_password validations: false

  has_paper_trail

  belongs_to :shop, inverse_of: :staffs
  has_many :check_ins, dependent: :destroy, inverse_of: :staff
  has_many :trainer_check_ins, class_name: 'CheckIn', foreign_key: :trainer_id,
                               inverse_of: :trainer, dependent: :nullify
  has_many :assigned_memberships, class_name: 'Membership', foreign_key: :assigned_staff_id,
                                  inverse_of: :assigned_staff, dependent: :nullify
  has_many :audit_logs, dependent: :nullify, inverse_of: :staff

  validates :name, :role, presence: true
  validates :role, inclusion: { in: ROLES }
  validates :username, uniqueness: { scope: :shop_id, allow_blank: true }, presence: true, if: :password_digest?

  def admin?
    role == 'admin'
  end

  def trainer?
    role == 'trainer'
  end
end
