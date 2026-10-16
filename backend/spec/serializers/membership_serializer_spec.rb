# frozen_string_literal: true

require 'rails_helper'

RSpec.describe MembershipSerializer do
  let(:shop) { create_shop(name: 'Serializer Spa', email: 'serializer@example.com') }
  let(:session_package) do
    Package.create!(shop: shop, name: '10 sessions', sessions_count: 10, price: 1_000_000)
  end
  let(:day_package) do
    Package.create!(shop: shop, name: '30 days', duration_days: 30, price: 500_000)
  end

  describe '#as_api_json' do
    it 'includes status: expiring when sessions_left is 3 or less' do
      membership = Membership.create!(
        shop: shop,
        package: session_package,
        customer_name: 'Nguyen Van A',
        phone: '0901234567',
        sessions_left: 3
      )

      json = described_class.new(membership).as_api_json
      expect(json['status']).to eq('expiring')
    end

    it 'includes status: expiring when sessions_left is 1' do
      membership = Membership.create!(
        shop: shop,
        package: session_package,
        customer_name: 'Nguyen Van B',
        phone: '0901234568',
        sessions_left: 1
      )

      json = described_class.new(membership).as_api_json
      expect(json['status']).to eq('expiring')
    end

    it 'includes status: active when sessions_left is greater than 3' do
      membership = Membership.create!(
        shop: shop,
        package: session_package,
        customer_name: 'Nguyen Van C',
        phone: '0901234569',
        sessions_left: 4
      )

      json = described_class.new(membership).as_api_json
      expect(json['status']).to eq('active')
    end

    it 'includes status: expired when sessions_left is 0' do
      membership = Membership.create!(
        shop: shop,
        package: session_package,
        customer_name: 'Nguyen Van D',
        phone: '0901234570',
        sessions_left: 0
      )

      json = described_class.new(membership).as_api_json
      expect(json['status']).to eq('expired')
    end

    it 'includes status: expiring when day-based expires within 7 days' do
      membership = Membership.create!(
        shop: shop,
        package: day_package,
        customer_name: 'Nguyen Van E',
        phone: '0901234571',
        expires_at: Date.current + 5.days
      )

      json = described_class.new(membership).as_api_json
      expect(json['status']).to eq('expiring')
    end
  end

  describe '#as_dashboard_json' do
    it 'returns the same payload as as_api_json' do
      membership = Membership.create!(
        shop: shop,
        package: session_package,
        customer_name: 'Nguyen Van F',
        phone: '0901234572',
        sessions_left: 2
      )

      serializer = described_class.new(membership)
      expect(serializer.as_dashboard_json).to eq(serializer.as_api_json)
      expect(serializer.as_dashboard_json['status']).to eq('expiring')
    end
  end
end
