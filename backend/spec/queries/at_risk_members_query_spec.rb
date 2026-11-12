# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AtRiskMembersQuery do
  let(:shop) { Shop.create!(name: 'Retention Gym', email: 'ret@gym.com', password: 'password123', plan: 'paid') }
  let(:package) { shop.packages.create!(name: 'Monthly VIP', price: 1_200_000, duration_days: 30) }

  def create_member(name:, phone:, created_days_ago: 45)
    m = CreateMembership.call(shop: shop, customer_name: name, phone: phone, package_id: package.id)
    m.update_columns(created_at: created_days_ago.days.ago, expires_at: 20.days.from_now.to_date) # rubocop:disable Rails/SkipsModelValidations
    m
  end

  describe '.call' do
    it 'categorizes high, medium, low risk and excludes healthy members' do
      now = Time.current

      high_m = create_member(name: 'High Risk Member', phone: '0901000001')
      CheckIn.create!(membership: high_m, checked_in_at: now - 25.days)

      med_m = create_member(name: 'Medium Risk Member', phone: '0901000002')
      CheckIn.create!(membership: med_m, checked_in_at: now - 16.days)

      low_m = create_member(name: 'Low Risk Member', phone: '0901000003')
      [25, 22, 19, 16, 13, 10].each { |d| CheckIn.create!(membership: low_m, checked_in_at: now - d.days) }

      healthy_m = create_member(name: 'Healthy Member', phone: '0901000004')
      CheckIn.create!(membership: healthy_m, checked_in_at: now - 2.days)

      report = described_class.call(shop, now: now)

      expect(report[:summary]).to include(
        total_at_risk: 3, high_risk_count: 1, medium_risk_count: 1,
        low_risk_count: 1, revenue_at_stake: 3_600_000
      )

      levels = report[:members].to_h { |r| [r[:membership_id], r[:risk_level]] }
      expect(levels[high_m.id]).to eq('high')
      expect(levels[med_m.id]).to eq('medium')
      expect(levels[low_m.id]).to eq('low')
      expect(levels).not_to have_key(healthy_m.id)
    end
  end
end
