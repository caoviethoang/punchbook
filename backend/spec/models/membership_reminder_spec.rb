# frozen_string_literal: true

require 'rails_helper'

RSpec.describe MembershipReminder, type: :model do
  let(:shop) { create_shop }
  let(:package) do
    Package.create!(shop: shop, name: '10-session package', sessions_count: 10, price: 100_000)
  end
  let(:membership) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'Nguyen Van A',
      phone: '0901234567',
      sessions_left: 2
    )
  end

  describe 'validations and associations' do
    it 'is valid with valid attributes' do
      reminder = described_class.new(
        membership: membership,
        sent_at: Time.current,
        reminder_type: 'expiring'
      )

      expect(reminder).to be_valid
    end

    it 'is invalid without sent_at' do
      reminder = described_class.new(
        membership: membership,
        sent_at: nil,
        reminder_type: 'expiring'
      )

      expect(reminder).not_to be_valid
      expect(reminder.errors[:sent_at]).to be_present
    end

    it 'belongs to membership' do
      reminder = described_class.create!(
        membership: membership,
        sent_at: Time.current,
        reminder_type: 'expiring'
      )

      expect(reminder.membership).to eq(membership)
    end
  end
end
