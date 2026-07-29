# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CheckIn, type: :model do
  let(:shop) { create_shop }
  let(:staff) { Staff.create!(shop: shop, name: 'Mai', role: 'staff') }
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

  describe 'validations' do
    it 'is valid with checked_in_at' do
      check_in = described_class.new(
        membership: membership,
        staff: staff,
        checked_in_at: Time.current
      )

      expect(check_in).to be_valid
    end

    it 'rejects blank checked_in_at' do
      check_in = described_class.new(
        membership: membership,
        staff: staff,
        checked_in_at: nil
      )

      expect(check_in).not_to be_valid
      expect(check_in.errors[:checked_in_at]).to be_present
    end
  end
end
