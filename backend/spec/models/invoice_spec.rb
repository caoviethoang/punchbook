# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Invoice, type: :model do
  let(:shop) { create_shop }
  let(:package) do
    Package.create!(shop: shop, name: '10-session massage', sessions_count: 10, price: 1_000_000)
  end
  let(:membership) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'Hoa Nguyen',
      phone: '0902000000',
      sessions_left: 5
    )
  end

  describe 'amount' do
    it 'rejects blank amount' do
      invoice = described_class.new(membership: membership, amount: nil)

      expect(invoice).not_to be_valid
      expect(invoice.errors[:amount]).to be_present
    end

    it 'rejects negative amount' do
      invoice = described_class.new(membership: membership, amount: -1)

      expect(invoice).not_to be_valid
      expect(invoice.errors[:amount]).to be_present
    end
  end

  describe 'status' do
    it 'defaults to pending when not provided' do
      invoice = described_class.create!(membership: membership, amount: 1_000_000)

      expect(invoice.status).to eq('pending')
    end

    it 'allows paid status' do
      invoice = described_class.create!(membership: membership, amount: 1_000_000, status: 'paid')

      expect(invoice.status).to eq('paid')
    end

    it 'rejects statuses outside the allowlist' do
      invoice = described_class.new(membership: membership, amount: 100_000, status: 'refunded')

      expect(invoice).not_to be_valid
      expect(invoice.errors[:status]).to be_present
    end

    it 'rejects blank status' do
      invoice = described_class.new(membership: membership, amount: 100_000, status: '')

      expect(invoice).not_to be_valid
      expect(invoice.errors[:status]).to be_present
    end
  end
end
