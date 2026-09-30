# frozen_string_literal: true

class ShopSerializer
  FIELDS = %i[id name phone address email plan plan_expires_at bank_name bank_account_no bank_account_name].freeze

  def initialize(shop)
    @shop = shop
  end

  def as_json(_options = nil)
    data = shop.as_json(only: FIELDS)
    data['plan_details'] = plan_details
    data
  end

  private

  attr_reader :shop

  def plan_details
    return 'Free' unless shop.plan == 'paid'

    paid_months = shop.shop_plan_payments.where(status: 'paid').order(updated_at: :desc).pick(:months)
    return "Premium #{paid_months == 12 ? '1 năm' : '1 tháng'}" if paid_months.present?

    yearly_plan? ? 'Premium 1 năm' : 'Premium 1 tháng'
  end

  def yearly_plan?
    shop.plan_expires_at.present? && shop.plan_expires_at > 6.months.from_now
  end
end
