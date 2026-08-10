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

  describe '#status' do
    let(:day_package) do
      Package.create!(shop: shop, name: 'Monthly gym', duration_days: 30, price: 500_000)
    end

    context 'with a session-based package' do
      it 'is expired when sessions_left is 0' do
        expect(build_member(package: package, sessions_left: 0).status).to eq('expired')
      end

      it 'is expiring at the sessions threshold (3)' do
        expect(build_member(package: package, sessions_left: 3).status).to eq('expiring')
      end

      it 'is expiring when sessions_left is 1' do
        expect(build_member(package: package, sessions_left: 1).status).to eq('expiring')
      end

      it 'is active just above the threshold (4)' do
        expect(build_member(package: package, sessions_left: 4).status).to eq('active')
      end
    end

    context 'with a day-based package' do
      it 'is expired when expires_at is before today' do
        membership = build_member(
          package: day_package,
          sessions_left: nil,
          expires_at: Date.current - 1.day
        )

        expect(membership.status).to eq('expired')
      end

      it 'is expired when expires_at is blank' do
        membership = build_member(package: day_package, sessions_left: nil, expires_at: nil)

        expect(membership.status).to eq('expired')
      end

      it 'is expiring when expires_at is today' do
        membership = build_member(
          package: day_package,
          sessions_left: nil,
          expires_at: Date.current
        )

        expect(membership.status).to eq('expiring')
      end

      it 'is expiring on the last day of the 7-day window' do
        membership = build_member(
          package: day_package,
          sessions_left: nil,
          expires_at: Date.current + 7.days
        )

        expect(membership.status).to eq('expiring')
      end

      it 'is active just outside the 7-day window' do
        membership = build_member(
          package: day_package,
          sessions_left: nil,
          expires_at: Date.current + 8.days
        )

        expect(membership.status).to eq('active')
      end
    end
  end

  def build_member(package:, sessions_left:, expires_at: nil)
    described_class.new(
      shop: shop,
      package: package,
      customer_name: 'Hoa Nguyen',
      phone: '0902000000',
      sessions_left: sessions_left,
      expires_at: expires_at
    )
  end
end
