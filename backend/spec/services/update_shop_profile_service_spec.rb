# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UpdateShopProfileService do
  let(:shop) { create_shop(name: 'Tiệm Cũ', phone: '0900000000', address: '123 Đường Cũ') }

  describe '#call' do
    it 'updates name, phone, and address successfully' do
      service = described_class.new(shop, { name: 'Tiệm Mới', phone: '0988888888', address: '456 Đường Mới' })
      result = service.call

      expect(result.success?).to be true
      expect(shop.reload.name).to eq('Tiệm Mới')
      expect(shop.phone).to eq('0988888888')
      expect(shop.address).to eq('456 Đường Mới')
    end

    it 'returns failure when name is blank' do
      service = described_class.new(shop, { name: '', phone: '0988888888' })
      result = service.call

      expect(result.success?).to be false
      expect(result.errors).to include("Name can't be blank")
    end
  end
end
