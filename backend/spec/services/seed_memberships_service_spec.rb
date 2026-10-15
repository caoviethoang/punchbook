# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SeedMembershipsService do
  subject(:service) { described_class.new(shop: shop, count: 5) }

  let(:shop) { create_shop(plan: 'free') }

  describe '#call' do
    it 'upgrades the shop to paid and creates requested number of memberships' do
      memberships = service.call

      expect(shop.reload.plan).to eq('paid')
      expect(memberships.size).to eq(5)
      expect(shop.memberships.count).to be >= 5
    end

    it 'ensures session-based and day-based packages exist' do
      service.call

      expect(shop.packages.any?(&:session_based?)).to be(true)
      expect(shop.packages.any?(&:day_based?)).to be(true)
    end

    it 'assigns unique names, phones, and valid package association' do
      memberships = service.call

      names = memberships.map(&:customer_name)
      phones = memberships.map(&:phone)

      expect(names.uniq.size).to eq(5)
      expect(phones.uniq.size).to eq(5)
      expect(memberships.all? { |m| m.package.present? }).to be(true)
    end
  end
end
