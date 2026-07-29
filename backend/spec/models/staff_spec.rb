# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Staff, type: :model do
  let(:shop) { create_shop }

  describe 'validations' do
    it 'is valid with name and role' do
      staff = described_class.new(shop: shop, name: 'Mai', role: 'staff')

      expect(staff).to be_valid
    end

    it 'rejects blank name' do
      staff = described_class.new(shop: shop, name: '', role: 'staff')

      expect(staff).not_to be_valid
      expect(staff.errors[:name]).to be_present
    end

    it 'rejects blank role' do
      staff = described_class.new(shop: shop, name: 'Mai', role: '')

      expect(staff).not_to be_valid
      expect(staff.errors[:role]).to be_present
    end
  end
end
