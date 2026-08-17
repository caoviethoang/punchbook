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

    context 'when shop is on free plan' do
      let(:free_shop) { create_shop(plan: 'free') }
      let(:free_package) do
        Package.create!(shop: free_shop, name: 'Free package', sessions_count: 5, price: 100_000)
      end

      before do
        15.times do |i|
          described_class.create!(
            shop: free_shop,
            package: free_package,
            customer_name: "Member #{i + 1}",
            phone: "09000000#{i.to_s.rjust(2, '0')}"
          )
        end
      end

      it 'allows creating up to 15 memberships' do
        expect(free_shop.memberships.count).to eq(15)
      end

      it 'rejects creating 16th membership for free shop' do
        member16 = described_class.new(
          shop: free_shop,
          package: free_package,
          customer_name: 'Member 16',
          phone: '0900000016'
        )

        expect(member16).not_to be_valid
        expect(member16.errors[:base]).to include(
          'Gói Free chỉ được tạo tối đa 15 hội viên. Vui lòng nâng cấp gói trả phí để tạo thêm hội viên.'
        )
      end

      it 'allows updating an existing membership beyond count check' do
        existing_member = free_shop.memberships.first
        existing_member.customer_name = 'Updated Name'

        expect(existing_member).to be_valid
      end
    end

    context 'when shop is on paid plan' do
      let(:paid_shop) { create_shop(plan: 'paid') }
      let(:paid_package) do
        Package.create!(shop: paid_shop, name: 'Paid package', sessions_count: 5, price: 100_000)
      end

      before do
        15.times do |i|
          described_class.create!(
            shop: paid_shop,
            package: paid_package,
            customer_name: "Member #{i + 1}",
            phone: "09000000#{i.to_s.rjust(2, '0')}"
          )
        end
      end

      it 'allows creating 16th or more memberships for paid shop' do
        member16 = described_class.new(
          shop: paid_shop,
          package: paid_package,
          customer_name: 'Member 16',
          phone: '0900000016'
        )

        expect(member16).to be_valid
      end
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
