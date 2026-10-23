# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'HardwareCheckIns', type: :request do
  let!(:shop) { create_shop(name: 'Iron Gym', email: 'irongym@example.com') }
  let(:device_headers) { { 'X-Device-Api-Key' => shop.device_api_key } }

  def create_members
    staff = Staff.create!(shop: shop, name: 'Main Reception', role: 'admin')
    session_pkg = Package.create!(shop: shop, name: '10 Sessions', sessions_count: 10, price: 500_000)
    day_pkg = Package.create!(shop: shop, name: '30 Days', duration_days: 30, price: 600_000)

    s_mem = Membership.create!(
      shop: shop, package: session_pkg, customer_name: 'Nguyen Van A',
      phone: '0901234567', card_number: 'RFID_1001', sessions_left: 5
    )
    d_mem = Membership.create!(
      shop: shop, package: day_pkg, customer_name: 'Tran Thi B',
      phone: '0909888777', card_number: 'RFID_2002', expires_at: Date.current + 10.days
    )
    [staff, s_mem, d_mem]
  end

  describe 'Authentication' do
    it 'rejects requests with missing device api key' do
      post '/api/v1/hardware/check_in', params: { identifier: 'RFID_1001' }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['code']).to eq('UNAUTHORIZED')
      expect(response.parsed_body['error']).to eq('Device API Key missing')
    end

    it 'rejects requests with invalid device api key' do
      post '/api/v1/hardware/check_in',
           params: { identifier: 'RFID_1001' },
           headers: { 'X-Device-Api-Key' => 'invalid_key_123' }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['code']).to eq('UNAUTHORIZED')
      expect(response.parsed_body['error']).to eq('Invalid Device API Key')
    end

    it 'accepts device_api_key in request params as fallback' do
      _staff, _s_mem, _d_mem = create_members

      post '/api/v1/hardware/check_in', params: { identifier: 'RFID_1001', device_api_key: shop.device_api_key }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['status']).to eq('success')
    end
  end

  describe 'Identifier Resolution & Check-in' do
    it 'checks in member using RFID card number' do
      _staff, session_member, _day_member = create_members

      expect do
        post '/api/v1/hardware/check_in',
             params: { identifier: 'RFID_1001', device_name: 'Cổng 1 - Turnstile' },
             headers: device_headers
      end.to change(CheckIn, :count).by(1)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['status']).to eq('success')
      expect(body['device_name']).to eq('Cổng 1 - Turnstile')
      expect(body['message']).to include('Còn lại 4 buổi')
      expect(session_member.reload.sessions_left).to eq(4)

      last_log = AuditLog.last
      expect(last_log.action).to eq('check_in')
      expect(last_log.details['source']).to eq('hardware_device')
      expect(last_log.details['device_name']).to eq('Cổng 1 - Turnstile')
      expect(last_log.details['identifier_used']).to eq('RFID_1001')
    end

    it 'checks in member using digital QR payload (PUNCHBOOK:UUID)' do
      _staff, session_member, _day_member = create_members

      post '/api/v1/hardware/check_in',
           params: { identifier: "PUNCHBOOK:#{session_member.id}" },
           headers: device_headers

      expect(response).to have_http_status(:ok)
      expect(session_member.reload.sessions_left).to eq(4)
    end

    it 'checks in member using raw UUID' do
      _staff, session_member, _day_member = create_members

      post '/api/v1/hardware/check_in',
           params: { identifier: session_member.id },
           headers: device_headers

      expect(response).to have_http_status(:ok)
      expect(session_member.reload.sessions_left).to eq(4)
    end

    it 'checks in member using phone number' do
      _staff, session_member, _day_member = create_members

      post '/api/v1/hardware/check_in',
           params: { identifier: '0901234567' },
           headers: device_headers

      expect(response).to have_http_status(:ok)
      expect(session_member.reload.sessions_left).to eq(4)
    end

    it 'checks in day-based package member without decrementing sessions' do
      _staff, _session_member, day_member = create_members

      post '/api/v1/hardware/check_in',
           params: { identifier: 'RFID_2002', device_name: 'Cửa FaceID Phòng Gym' },
           headers: device_headers

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['status']).to eq('success')
      expect(body['message']).to include('Hạn sử dụng đến')
      expect(day_member.reload.sessions_left).to be_nil
    end
  end

  describe 'Edge cases & Error handling' do
    it 'returns 422 when identifier is missing or blank' do
      post '/api/v1/hardware/check_in', params: { identifier: '' }, headers: device_headers

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['code']).to eq('IDENTIFIER_MISSING')
    end

    it 'returns 404 when member identifier is not found' do
      post '/api/v1/hardware/check_in', params: { identifier: 'NON_EXISTENT_CARD' }, headers: device_headers

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['code']).to eq('MEMBERSHIP_NOT_FOUND')
    end

    it 'does not match membership belonging to another shop' do
      other_shop = create_shop(name: 'Other Gym', email: 'other@gym.com')
      other_member = Membership.create!(
        shop: other_shop,
        package: Package.create!(shop: other_shop, name: 'Pkg', price: 100_000, sessions_count: 5),
        customer_name: 'Other Person',
        phone: '0988000111',
        card_number: 'RFID_OTHER'
      )

      post '/api/v1/hardware/check_in', params: { identifier: other_member.card_number }, headers: device_headers

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['code']).to eq('MEMBERSHIP_NOT_FOUND')
    end

    it 'returns 422 with NO_SESSIONS_LEFT when session-based membership has 0 sessions left' do
      _staff, session_member, _day_member = create_members
      session_member.update!(sessions_left: 0)

      post '/api/v1/hardware/check_in', params: { identifier: 'RFID_1001' }, headers: device_headers

      expect(response).to have_http_status(:unprocessable_content)
      body = response.parsed_body
      expect(body['code']).to eq('NO_SESSIONS_LEFT')
      expect(body['error']).to eq('Membership has no sessions left')
      expect(body['membership']['id']).to eq(session_member.id)
      expect(body['membership']['sessions_left']).to eq(0)
    end

    it 'returns 422 with MEMBERSHIP_EXPIRED when day-based membership is expired' do
      _staff, _session_member, day_member = create_members
      day_member.update!(expires_at: Date.current - 1.day)

      post '/api/v1/hardware/check_in', params: { identifier: 'RFID_2002' }, headers: device_headers

      expect(response).to have_http_status(:unprocessable_content)
      body = response.parsed_body
      expect(body['code']).to eq('MEMBERSHIP_EXPIRED')
      expect(body['error']).to eq('Membership has expired')
      expect(body['membership']['id']).to eq(day_member.id)
    end
  end

  describe 'Regenerate Device API Key' do
    it 'allows shop owner to regenerate device API key via settings' do
      old_key = shop.device_api_key

      post '/api/v1/settings/regenerate_device_api_key', headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      new_key = body.dig('shop', 'device_api_key')
      expect(new_key).to be_present
      expect(new_key).not_to eq(old_key)
      expect(shop.reload.device_api_key).to eq(new_key)
    end
  end
end
