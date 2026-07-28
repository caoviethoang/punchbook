# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Shop, type: :model do
  describe 'plan' do
    it 'defaults to free when not provided' do
      shop = described_class.create!(name: 'Spa Lan', phone: '0901000000')

      expect(shop.plan).to eq('free')
    end

    it 'allows paid plan' do
      shop = described_class.create!(name: 'Gym Pro', phone: '0902000000', plan: 'paid')

      expect(shop.plan).to eq('paid')
    end

    it 'rejects plans outside the allowlist' do
      shop = described_class.new(name: 'Invalid', phone: '0903000000', plan: 'enterprise')

      expect(shop).not_to be_valid
      expect(shop.errors[:plan]).to be_present
    end

    it 'rejects blank plan' do
      shop = described_class.new(name: 'Blank', phone: '0904000000', plan: '')

      expect(shop).not_to be_valid
      expect(shop.errors[:plan]).to be_present
    end
  end
end
