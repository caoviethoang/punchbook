# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Shop, type: :model do
  describe 'name' do
    it 'rejects blank name' do
      shop = build_shop(name: '')

      expect(shop).not_to be_valid
      expect(shop.errors[:name]).to be_present
    end
  end

  describe 'plan' do
    it 'defaults to free when not provided' do
      shop = create_shop(name: 'Spa Lan', phone: '0901000000')

      expect(shop.plan).to eq('free')
    end

    it 'allows paid plan' do
      shop = create_shop(name: 'Gym Pro', phone: '0902000000', plan: 'paid')

      expect(shop.plan).to eq('paid')
    end

    it 'rejects plans outside the allowlist' do
      shop = build_shop(name: 'Invalid', phone: '0903000000', plan: 'enterprise')

      expect(shop).not_to be_valid
      expect(shop.errors[:plan]).to be_present
    end

    it 'rejects blank plan' do
      shop = build_shop(name: 'Blank', phone: '0904000000', plan: '')

      expect(shop).not_to be_valid
      expect(shop.errors[:plan]).to be_present
    end
  end

  describe 'devise authentication' do
    it 'requires a unique email and password' do
      create_shop(email: 'owner@example.com')
      duplicate = build_shop(email: 'owner@example.com')

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:email]).to be_present
    end
  end

  def build_shop(**attrs)
    defaults = {
      name: 'Lan Spa',
      phone: '0901000000',
      email: "shop-#{SecureRandom.hex(4)}@example.com",
      password: 'password123',
      password_confirmation: 'password123'
    }

    described_class.new(defaults.merge(attrs))
  end
end
