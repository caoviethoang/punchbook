# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Package, type: :model do
  let(:shop) { create_shop }

  describe 'duration_days / sessions_count' do
    it 'allows session-based package with sessions_count only' do
      package = described_class.create!(
        shop: shop,
        name: '10-session massage',
        sessions_count: 10,
        price: 1_000_000
      )

      expect(package).to be_session_based
      expect(package).not_to be_day_based
      expect(package.duration_days).to be_nil
    end

    it 'allows day-based package with duration_days only' do
      package = described_class.create!(
        shop: shop,
        name: 'Monthly gym',
        duration_days: 30,
        price: 500_000
      )

      expect(package).to be_day_based
      expect(package).not_to be_session_based
      expect(package.sessions_count).to be_nil
    end

    it 'rejects package with both sessions_count and duration_days' do
      package = described_class.new(
        shop: shop,
        name: 'Invalid both',
        sessions_count: 10,
        duration_days: 30,
        price: 1_000_000
      )

      expect(package).not_to be_valid
      expect(package.errors[:base]).to include(
        'Must set exactly one of sessions_count or duration_days'
      )
    end

    it 'rejects package with neither sessions_count nor duration_days' do
      package = described_class.new(shop: shop, name: 'Invalid none', price: 100_000)

      expect(package).not_to be_valid
      expect(package.errors[:base]).to be_present
    end

    it 'rejects non-positive duration_days' do
      package = described_class.new(
        shop: shop,
        name: 'Invalid days',
        duration_days: 0,
        price: 100_000
      )

      expect(package).not_to be_valid
      expect(package.errors[:duration_days]).to be_present
    end
  end
end
