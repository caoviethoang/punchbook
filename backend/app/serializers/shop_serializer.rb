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

    latest_payment = shop.shop_plan_payments.where(status: 'paid').order(updated_at: :desc).first
    months = latest_payment&.months

    if months == 12
      'Premium 1 năm'
    elsif months == 1
      'Premium 1 tháng'
    elsif shop.plan_expires_at && shop.plan_expires_at > 6.months.from_now
      'Premium 1 năm'
    else
      'Premium 1 tháng'
    end
  end
end
