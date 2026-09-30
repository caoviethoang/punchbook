# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UpgradeShopPlanService do
  let(:shop) do
    create_shop(
      name: 'Test Shop',
      plan: 'free',
      plan_expires_at: nil
    )
  end

  describe '#call' do
    it 'upgrades plan to paid and sets plan_expires_at by months' do
      result = described_class.new(shop, months: 3).call

      expect(result.success?).to be true
      expect(result.shop.plan).to eq('paid')
      expect(result.shop.plan_expires_at).to be_within(1.minute).of(3.months.from_now)
    end

    it 'extends existing plan_expires_at if in the future' do
      future_date = 10.days.from_now
      shop.update!(plan: 'paid', plan_expires_at: future_date)

      result = described_class.new(shop, months: 1).call

      expect(result.success?).to be true
      expect(result.shop.plan_expires_at).to be_within(1.minute).of(future_date + 1.month)
    end

    it 'fails when months is invalid' do
      result = described_class.new(shop, months: 0).call

      expect(result.success?).to be false
      expect(result.errors).to include('Số tháng nâng cấp không hợp lệ')
    end
  end
end
