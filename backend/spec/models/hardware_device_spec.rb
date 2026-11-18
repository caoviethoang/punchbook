# frozen_string_literal: true

require 'rails_helper'

RSpec.describe HardwareDevice, type: :model do
  let(:shop) { create_shop(name: 'IoT Gym', email: 'iot@example.com') }

  describe 'validations and token generation' do
    it 'generates device_token automatically on create' do
      device = described_class.create!(
        shop: shop,
        name: 'Cổng xoay chính',
        device_type: 'turnstile',
        location: 'Tầng 1'
      )

      expect(device.device_token).to be_present
      expect(device.is_active).to be true
      expect(device.device_type).to eq('turnstile')
    end

    it 'requires a name' do
      device = described_class.new(shop: shop, name: nil, device_type: 'turnstile')
      expect(device).not_to be_valid
      expect(device.errors[:name]).to include("can't be blank")
    end

    it 'validates allowed device_types' do
      device = described_class.new(shop: shop, name: 'Cổng', device_type: 'unknown_type')
      expect(device).not_to be_valid
      expect(device.errors[:device_type]).to include('is not included in the list')
    end

    it 'enforces uniqueness of device_token' do
      d1 = described_class.create!(shop: shop, name: 'D1', device_type: 'turnstile')
      d2 = described_class.new(shop: shop, name: 'D2', device_type: 'turnstile', device_token: d1.device_token)
      expect(d2).not_to be_valid
      expect(d2.errors[:device_token]).to include('has already been taken')
    end
  end

  describe '#online? and #status' do
    let(:device) { described_class.create!(shop: shop, name: 'Gate', device_type: 'turnstile') }

    it 'returns false and offline when never pinged' do
      expect(device.online?).to be false
      expect(device.status).to eq('offline')
    end

    it 'returns true and online when pinged recently within 5 minutes' do
      device.update!(last_ping_at: 2.minutes.ago)
      expect(device.online?).to be true
      expect(device.status).to eq('online')
    end

    it 'returns false and offline when last ping is older than 5 minutes' do
      device.update!(last_ping_at: 6.minutes.ago)
      expect(device.online?).to be false
      expect(device.status).to eq('offline')
    end
  end

  describe '#ping!' do
    let(:device) { described_class.create!(shop: shop, name: 'Gate', device_type: 'turnstile') }

    it 'updates last_ping_at to current time' do
      expect { device.ping! }.to change { device.reload.last_ping_at }.from(nil)
      expect(device.last_ping_at).to be_within(2.seconds).of(Time.current)
    end
  end

  describe '#as_api_json' do
    let(:device) do
      described_class.create!(
        shop: shop,
        name: 'Cổng VIP',
        device_type: 'magnetic_lock',
        location: 'Tầng 2'
      )
    end

    it 'serializes all necessary device attributes' do
      json = device.as_api_json
      expect(json[:id]).to eq(device.id)
      expect(json[:name]).to eq('Cổng VIP')
      expect(json[:device_type]).to eq('magnetic_lock')
      expect(json[:location]).to eq('Tầng 2')
      expect(json[:device_token]).to eq(device.device_token)
      expect(json[:is_active]).to be true
      expect(json[:online]).to be false
      expect(json[:status]).to eq('offline')
    end
  end
end
