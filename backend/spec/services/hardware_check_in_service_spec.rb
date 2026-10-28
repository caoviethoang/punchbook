# frozen_string_literal: true

require 'rails_helper'

RSpec.describe HardwareCheckInService do
  let!(:shop) { create_shop }
  let!(:package) { Package.create!(shop: shop, name: '10 Sessions', sessions_count: 10, price: 500_000) }
  let!(:membership) do
    Staff.create!(shop: shop, name: 'Main Staff', role: 'admin')
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'John Doe',
      phone: '0901234567',
      card_number: 'RFID_9999',
      sessions_left: 5
    )
  end

  describe '.call' do
    it 'raises error when identifier is blank' do
      expect do
        described_class.call(shop: shop, identifier: '   ')
      end.to raise_error(HardwareCheckInService::Error) { |e|
        expect(e.code).to eq('IDENTIFIER_MISSING')
      }
    end

    it 'raises error when membership not found' do
      expect do
        described_class.call(shop: shop, identifier: 'UNKNOWN')
      end.to raise_error(HardwareCheckInService::Error) { |e|
        expect(e.code).to eq('MEMBERSHIP_NOT_FOUND')
      }
    end

    it 'finds membership by card_number and performs check-in' do
      result = described_class.call(shop: shop, identifier: 'RFID_9999', device_name: 'Gate 1')

      expect(result[:message]).to include('Còn lại 4 buổi')
      expect(result[:device_name]).to eq('Gate 1')
      expect(membership.reload.sessions_left).to eq(4)
    end

    it 'finds membership by phone number with spaces or hyphens' do
      result = described_class.call(shop: shop, identifier: '090-123-4567')

      expect(result[:membership].id).to eq(membership.id)
      expect(membership.reload.sessions_left).to eq(4)
    end

    it 'finds membership by UUID' do
      result = described_class.call(shop: shop, identifier: membership.id)

      expect(result[:membership].id).to eq(membership.id)
      expect(membership.reload.sessions_left).to eq(4)
    end

    it 'finds membership by QR prefix PUNCHBOOK:UUID' do
      result = described_class.call(shop: shop, identifier: "PUNCHBOOK:#{membership.id}")

      expect(result[:membership].id).to eq(membership.id)
      expect(membership.reload.sessions_left).to eq(4)
    end

    it 'raises NO_SESSIONS_LEFT error with attached membership when sessions are 0' do
      membership.update!(sessions_left: 0)

      expect do
        described_class.call(shop: shop, identifier: 'RFID_9999')
      end.to raise_error(HardwareCheckInService::Error) { |e|
        expect(e.code).to eq('NO_SESSIONS_LEFT')
        expect(e.membership.id).to eq(membership.id)
      }
    end

    it 'raises MEMBERSHIP_EXPIRED error with attached membership when expired' do
      day_pkg = Package.create!(shop: shop, name: '30 Days', duration_days: 30, price: 600_000)
      day_mem = Membership.create!(
        shop: shop, package: day_pkg, customer_name: 'Expired Mem',
        phone: '0909999999', card_number: 'RFID_EXPIRED', expires_at: Date.current - 1.day
      )

      expect do
        described_class.call(shop: shop, identifier: 'RFID_EXPIRED')
      end.to raise_error(HardwareCheckInService::Error) { |e|
        expect(e.code).to eq('MEMBERSHIP_EXPIRED')
        expect(e.membership.id).to eq(day_mem.id)
      }
    end
  end
end
