# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Membership, type: :model do
  let(:shop) { create_shop }
  let(:package) do
    Package.create!(shop: shop, name: '10-session massage', sessions_count: 10, price: 1_000_000)
  end

  describe 'validations' do
    it 'is valid with customer_name and phone' do
      membership = described_class.new(
        shop: shop,
        package: package,
        customer_name: 'Hoa Nguyen',
        phone: '0902000000',
        sessions_left: 5
      )

      expect(membership).to be_valid
    end

    it 'rejects blank customer_name' do
      membership = described_class.new(
        shop: shop,
        package: package,
        customer_name: '',
        phone: '0902000000',
        sessions_left: 5
      )

      expect(membership).not_to be_valid
      expect(membership.errors[:customer_name]).to be_present
    end

    it 'rejects blank phone' do
      membership = described_class.new(
        shop: shop,
        package: package,
        customer_name: 'Hoa Nguyen',
        phone: '',
        sessions_left: 5
      )

      expect(membership).not_to be_valid
      expect(membership.errors[:phone]).to be_present
    end

    it 'rejects negative sessions_left' do
      membership = described_class.new(
        shop: shop,
        package: package,
        customer_name: 'Hoa Nguyen',
        phone: '0902000000',
        sessions_left: -1
      )

      expect(membership).not_to be_valid
      expect(membership.errors[:sessions_left]).to be_present
    end
  end
end
