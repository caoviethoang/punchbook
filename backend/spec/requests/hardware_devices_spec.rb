# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'HardwareDevices', type: :request do
  let!(:shop) { create_shop(name: 'Iron Gym', email: 'irongym@example.com') }
  let!(:admin_staff) { Staff.create!(shop: shop, name: 'Admin User', role: 'admin') }
  let(:headers) { auth_headers(shop) }

  describe 'GET /api/v1/hardware_devices' do
    it 'returns list of devices belonging to current shop' do
      d1 = HardwareDevice.create!(shop: shop, name: 'Cổng 1', device_type: 'turnstile', location: 'Tầng 1')
      _d2 = HardwareDevice.create!(shop: shop, name: 'Cửa VIP', device_type: 'magnetic_lock', location: 'Tầng 2')

      # Other shop device should not appear
      other_shop = create_shop(name: 'Other', email: 'other@example.com')
      HardwareDevice.create!(shop: other_shop, name: 'Other Gate', device_type: 'turnstile')

      get '/api/v1/hardware_devices', headers: headers

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['devices'].length).to eq(2)
      expect(body['devices'].pluck('name')).to contain_exactly('Cổng 1', 'Cửa VIP')
      first = body['devices'].find { |d| d['id'] == d1.id }
      expect(first['device_token']).to eq(d1.device_token)
      expect(first['online']).to be false
      expect(first['status']).to eq('offline')
    end

    it 'returns unauthorized without auth headers' do
      get '/api/v1/hardware_devices'
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'POST /api/v1/hardware_devices' do
    it 'creates a new device with generated token' do
      expect do
        post '/api/v1/hardware_devices',
             params: {
               hardware_device: {
                 name: 'Cổng xoay RFID lối vào',
                 device_type: 'turnstile',
                 location: 'Lối vào chính',
                 is_active: true
               }
             },
             headers: headers
      end.to change(HardwareDevice, :count).by(1)

      expect(response).to have_http_status(:created)
      device = response.parsed_body['device']
      expect(device['name']).to eq('Cổng xoay RFID lối vào')
      expect(device['device_type']).to eq('turnstile')
      expect(device['location']).to eq('Lối vào chính')
      expect(device['device_token']).to be_present
      expect(device['online']).to be false
    end

    it 'validates device_type presence and inclusion' do
      post '/api/v1/hardware_devices',
           params: { hardware_device: { name: 'Máy quét', device_type: 'invalid_type' } },
           headers: headers

      expect(response).to have_http_status(:unprocessable_content)
      body = response.parsed_body
      expect(body['error']).to include('Device type is not included in the list')
    end
  end

  describe 'PATCH /api/v1/hardware_devices/:id' do
    it 'updates hardware device details' do
      device = HardwareDevice.create!(shop: shop, name: 'Old Gate', device_type: 'turnstile')

      patch "/api/v1/hardware_devices/#{device.id}",
            params: { hardware_device: { name: 'New Gate Name', is_active: false } },
            headers: headers

      expect(response).to have_http_status(:ok)
      expect(device.reload.name).to eq('New Gate Name')
      expect(device.is_active).to be false
    end
  end

  describe 'DELETE /api/v1/hardware_devices/:id' do
    it 'destroys the hardware device' do
      device = HardwareDevice.create!(shop: shop, name: 'Temporary Gate', device_type: 'turnstile')

      expect do
        delete "/api/v1/hardware_devices/#{device.id}", headers: headers
      end.to change(HardwareDevice, :count).by(-1)

      expect(response).to have_http_status(:ok)
    end
  end

  describe 'POST /api/v1/hardware_devices/:id/regenerate_token' do
    it 'generates a new unique device token' do
      device = HardwareDevice.create!(shop: shop, name: 'Turnstile A', device_type: 'turnstile')
      old_token = device.device_token

      post "/api/v1/hardware_devices/#{device.id}/regenerate_token", headers: headers

      expect(response).to have_http_status(:ok)
      new_token = response.parsed_body.dig('device', 'device_token')
      expect(new_token).to be_present
      expect(new_token).not_to eq(old_token)
      expect(device.reload.device_token).to eq(new_token)
    end
  end

  describe 'GET /api/v1/hardware_devices/logs' do
    def create_device_check_in
      device = HardwareDevice.create!(
        shop: shop, name: 'Cổng Turnstile A', device_type: 'turnstile', location: 'Cửa trước'
      )
      pkg = Package.create!(shop: shop, name: 'Gói VIP 10 Buổi', sessions_count: 10, price: 1_000_000)
      member = Membership.create!(
        shop: shop, package: pkg, customer_name: 'Đinh Long', phone: '0912345678', card_number: 'RFID_DL_1'
      )
      CheckIn.create!(membership: member, staff: admin_staff, hardware_device: device, checked_in_at: Time.current)
    end

    it 'returns recent check-ins that occurred via hardware devices' do
      ci = create_device_check_in
      get '/api/v1/hardware_devices/logs', headers: headers

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['logs'].length).to eq(1)

      expect(body['logs'].first).to include(
        'id' => ci.id, 'customer_name' => 'Đinh Long', 'phone' => '0912345678',
        'card_number' => 'RFID_DL_1', 'package_name' => 'Gói VIP 10 Buổi',
        'device_name' => 'Cổng Turnstile A', 'device_type' => 'turnstile',
        'location' => 'Cửa trước', 'access_granted' => true
      )
    end
  end
end
