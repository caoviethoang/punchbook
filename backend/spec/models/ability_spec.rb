# frozen_string_literal: true

require 'rails_helper'
require 'cancan/matchers'

RSpec.describe Ability, type: :model do
  let(:shop) { create_shop }
  let(:admin_staff) { Staff.create!(shop: shop, name: 'Owner', username: 'owner_admin', password: 'password123', role: 'admin') }
  let(:reception_staff) { Staff.create!(shop: shop, name: 'Receptionist', username: 'letan_1', password: 'password123', role: 'staff') }

  context 'when staff is an admin' do
    subject(:ability) { Ability.new(admin_staff) }

    it 'can manage all resources' do
      expect(ability).to be_able_to(:manage, :all)
      expect(ability).to be_able_to(:manage, Package)
      expect(ability).to be_able_to(:manage, Staff)
      expect(ability).to be_able_to(:update, shop)
    end
  end

  context 'when staff is a receptionist (staff role)' do
    subject(:ability) { Ability.new(reception_staff) }

    it 'can manage Memberships and CheckIns' do
      expect(ability).to be_able_to(:manage, Membership.new(shop: shop))
      expect(ability).to be_able_to(:manage, CheckIn.new(membership: Membership.new(shop: shop)))
    end

    it 'can read Packages' do
      expect(ability).to be_able_to(:read, Package.new(shop: shop))
    end

    it 'cannot create, update, or destroy Packages' do
      expect(ability).not_to be_able_to(:create, Package)
      expect(ability).not_to be_able_to(:update, Package)
      expect(ability).not_to be_able_to(:destroy, Package)
    end

    it 'cannot manage Staff accounts' do
      expect(ability).not_to be_able_to(:manage, Staff)
    end

    it 'cannot update Shop profile or settings' do
      expect(ability).not_to be_able_to(:update, shop)
    end
  end
end
