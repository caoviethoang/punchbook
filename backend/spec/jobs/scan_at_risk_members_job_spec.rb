# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ScanAtRiskMembersJob do
  let(:shop) { Shop.create!(name: 'Scan Gym', email: 'scan@gym.com', password: 'password123', plan: 'paid') }
  let(:package) { shop.packages.create!(name: 'Monthly Pack', price: 1_000_000, duration_days: 30) }

  describe '#perform' do
    it 'tags at-risk members and clears churn_risk_level when recovered' do
      member = CreateMembership.call(shop: shop, customer_name: 'Absent Member', phone: '0902000001',
                                     package_id: package.id)
      member.update_columns(created_at: 30.days.ago, expires_at: 20.days.from_now.to_date) # rubocop:disable Rails/SkipsModelValidations
      CheckIn.create!(membership: member, checked_in_at: 22.days.ago)

      described_class.perform_now(shop.id)
      expect(member.reload.churn_risk_level).to eq('high')
      expect(member.churn_risk_scored_at).to be_present

      # Member returns to gym today
      CheckIn.create!(membership: member, checked_in_at: Time.current)
      described_class.perform_now(shop.id)
      expect(member.reload.churn_risk_level).to be_nil
    end
  end
end
