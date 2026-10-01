# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AuthenticateShopService do
  let!(:shop) do
    Shop.create!(
      name: 'Test Gym',
      email: 'owner@test.com',
      password: 'password123',
      phone: '0901234567'
    )
  end

  describe '.call' do
    context 'when authenticating shop owner' do
      it 'returns success payload with JWT token, shop, and staff' do
        result = described_class.call(input: 'owner@test.com', password: 'password123')

        expect(result.success?).to be true
        expect(result.payload[:token]).to be_present
        expect(result.payload[:shop]['name']).to eq('Test Gym')
        expect(result.payload[:staff]['role']).to eq('admin')
      end

      it 'returns error on invalid password' do
        result = described_class.call(input: 'owner@test.com', password: 'wrongpassword')

        expect(result.success?).to be false
        expect(result.error).to be_present
      end
    end

    context 'when authenticating staff by username' do
      let(:staff) do
        shop.staffs.create!(
          name: 'Receptionist',
          username: 'receptionist',
          password: 'password123',
          role: 'staff'
        )
      end

      it 'authenticates unique staff successfully' do
        staff
        result = described_class.call(input: 'receptionist', password: 'password123')

        expect(result.success?).to be true
        expect(result.payload[:staff]['name']).to eq('Receptionist')
      end

      it 'authenticates staff with scoped shop_email context' do
        staff
        result = described_class.call(
          input: 'receptionist',
          password: 'password123',
          shop_context: 'owner@test.com'
        )

        expect(result.success?).to be true
        expect(result.payload[:staff]['name']).to eq('Receptionist')
      end
    end
  end
end
