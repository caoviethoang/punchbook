# frozen_string_literal: true

class MembershipTransfer < ApplicationRecord
  belongs_to :shop
  belongs_to :source_membership, class_name: 'Membership'
  belongs_to :target_membership, class_name: 'Membership'
  belongs_to :staff, optional: true
  belongs_to :invoice, optional: true

  validates :fee, numericality: { greater_than_or_equal_to: 0 }
  validates :sessions_transferred, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :days_transferred, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  scope :recent, -> { order(created_at: :desc) }

  def as_api_json
    base_info.merge(party_info).merge(metric_info)
  end

  private

  def base_info
    {
      'id' => id,
      'shop_id' => shop_id,
      'invoice_id' => invoice_id,
      'note' => note,
      'created_at' => created_at&.iso8601
    }
  end

  def party_info
    {
      'source_membership_id' => source_membership_id,
      'source_customer_name' => source_membership&.customer_name,
      'source_phone' => source_membership&.phone,
      'target_membership_id' => target_membership_id,
      'target_customer_name' => target_membership&.customer_name,
      'target_phone' => target_membership&.phone,
      'staff_id' => staff_id,
      'staff_name' => staff&.name || 'Hệ thống'
    }
  end

  def metric_info
    {
      'sessions_transferred' => sessions_transferred,
      'days_transferred' => days_transferred,
      'fee' => fee
    }
  end
end
