# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Kiosk API', type: :request do
  let(:shop) do
    create_shop(
      name: 'Titan Fitness',
      email: 'titan@example.com',
      phone: '0901234567',
      kiosk_enabled: true,
      kiosk_pin: '9999',
      kiosk_welcome_message: 'Chào mừng bạn đến với Titan Fitness!',
      kiosk_audio_enabled: true,
      bank_name: 'MBBank',
      bank_account_no: '0987654321',
      bank_account_name: 'TITAN FITNESS'
    )
  end
  let(:kiosk_headers) { { 'X-Kiosk-Token' => shop.kiosk_token } }

  before do
    Staff.create!(shop: shop, name: 'Manager', role: 'admin')
  end

  def create_packages
    session_pkg = Package.create!(shop: shop, name: 'Gói 10 buổi Gym', sessions_count: 10, price: 500_000)
    time_pkg = Package.create!(shop: shop, name: 'Gói 1 Tháng Gym', duration_days: 30, price: 800_000)
    [session_pkg, time_pkg]
  end

  describe 'POST /api/v1/kiosk/login' do
    it 'authenticates kiosk device with valid PIN and shop_id' do
      post '/api/v1/kiosk/login', params: { shop_id: shop.id, pin: '9999' }

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['kiosk_token']).to eq(shop.kiosk_token)
      expect(body.dig('shop', 'name')).to eq('Titan Fitness')
    end

    it 'authenticates kiosk device with email and PIN' do
      post '/api/v1/kiosk/login', params: { email: 'titan@example.com', pin: '9999' }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['kiosk_token']).to eq(shop.kiosk_token)
    end

    it 'rejects invalid PIN' do
      post '/api/v1/kiosk/login', params: { shop_id: shop.id, pin: '0000' }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['code']).to eq('INVALID_PIN')
    end

    it 'returns forbidden when kiosk is disabled' do
      shop.update!(kiosk_enabled: false)

      post '/api/v1/kiosk/login', params: { shop_id: shop.id, pin: '9999' }

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['code']).to eq('KIOSK_DISABLED')
    end

    it 'returns not found when shop does not exist' do
      post '/api/v1/kiosk/login', params: { shop_id: SecureRandom.uuid, pin: '9999' }

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['code']).to eq('SHOP_NOT_FOUND')
    end
  end

  describe 'GET /api/v1/kiosk/config' do
    it 'returns kiosk config with valid kiosk token header' do
      get '/api/v1/kiosk/config', headers: kiosk_headers

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body.dig('shop', 'name')).to eq('Titan Fitness')
      expect(body.dig('shop', 'bank_name')).to eq('MBBank')
      expect(body.dig('kiosk', 'welcome_message')).to eq('Chào mừng bạn đến với Titan Fitness!')
      expect(body.dig('kiosk', 'audio_enabled')).to be true
      expect(body.dig('kiosk', 'camera_enabled')).to be true
    end

    it 'accepts Bearer token in Authorization header' do
      get '/api/v1/kiosk/config', headers: { 'Authorization' => "Bearer #{shop.kiosk_token}" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig('shop', 'name')).to eq('Titan Fitness')
    end

    it 'rejects requests with missing or invalid token' do
      get '/api/v1/kiosk/config', headers: { 'X-Kiosk-Token' => 'invalid_token' }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['code']).to eq('UNAUTHORIZED')
    end
  end

  describe 'POST /api/v1/kiosk/check_in' do
    let!(:active_member) do
      session_pkg, = create_packages
      Membership.create!(
        shop: shop,
        package: session_pkg,
        customer_name: 'Tran Van Nam',
        phone: '0901112233',
        card_number: 'RFID_5555',
        sessions_left: 5
      )
    end

    let(:payos_result) do
      PayosService::Result.new(
        payment_link_id: 'pl-kiosk-123',
        checkout_url: 'https://pay.payos.vn/web/kiosk123',
        qr_code: '000201010212...'
      )
    end

    before do
      allow(PayosService).to receive(:create_payment_link).and_return(payos_result)
    end

    it 'successfully checks in with phone number' do
      post '/api/v1/kiosk/check_in',
           params: { identifier: '0901112233' },
           headers: kiosk_headers

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['status']).to eq('success')
      expect(body.dig('membership', 'customer_name')).to eq('Tran Van Nam')
      expect(body.dig('membership', 'sessions_left')).to eq(4)
      expect(body['check_in']['id']).to be_present
      expect(body['audio_text']).to include('Xin chào Tran Van Nam! Mời bạn vào tập.')
      expect(active_member.reload.sessions_left).to eq(4)
    end

    it 'successfully checks in with card number' do
      post '/api/v1/kiosk/check_in',
           params: { identifier: 'RFID_5555' },
           headers: kiosk_headers

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['status']).to eq('success')
    end

    it 'successfully checks in with PUNCHBOOK:<uuid> QR format' do
      post '/api/v1/kiosk/check_in',
           params: { identifier: "PUNCHBOOK:#{active_member.id}" },
           headers: kiosk_headers

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['status']).to eq('success')
    end

    it 'returns milestone_reached and congratulatory audio text when milestone hit' do
      # rubocop:disable Rails/SkipsModelValidations
      active_member.update_columns(total_check_ins_count: 9)
      # rubocop:enable Rails/SkipsModelValidations

      post '/api/v1/kiosk/check_in',
           params: { identifier: '0901112233' },
           headers: kiosk_headers

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['milestone_reached']).to eq(10)
      expect(body['audio_text']).to include('cột mốc 10 lần check-in')
    end

    it 'returns denied with VietQR renewal info when member is out of sessions' do
      active_member.update!(sessions_left: 0)

      post '/api/v1/kiosk/check_in',
           params: { identifier: '0901112233' },
           headers: kiosk_headers

      expect(response).to have_http_status(:unprocessable_content)
      body = response.parsed_body
      expect(body['status']).to eq('denied')
      expect(body['code']).to eq('NO_SESSIONS_LEFT')
      expect(body['renewal']).to be_present
      expect(body.dig('renewal', 'amount')).to eq(500_000)
      expect(body.dig('renewal', 'vietqr_url')).to include('https://img.vietqr.io/image/MBBank-0987654321-compact2.png')
      expect(body['audio_text']).to include('quét mã QR để gia hạn')
    end

    it 'returns denied with renewal info when membership is expired' do
      _, time_pkg = create_packages
      Membership.create!(
        shop: shop,
        package: time_pkg,
        customer_name: 'Le Thi Hoa',
        phone: '0908889999',
        expires_at: 2.days.ago
      )

      post '/api/v1/kiosk/check_in',
           params: { identifier: '0908889999' },
           headers: kiosk_headers

      expect(response).to have_http_status(:unprocessable_content)
      body = response.parsed_body
      expect(body['status']).to eq('denied')
      expect(body['code']).to eq('MEMBERSHIP_EXPIRED')
      expect(body['renewal']).to be_present
      expect(body.dig('renewal', 'amount')).to eq(800_000)
    end

    it 'returns denied without renewal when membership is frozen' do
      active_member.update!(status: 'frozen', frozen_until: 1.week.from_now)

      post '/api/v1/kiosk/check_in',
           params: { identifier: '0901112233' },
           headers: kiosk_headers

      expect(response).to have_http_status(:unprocessable_content)
      body = response.parsed_body
      expect(body['status']).to eq('denied')
      expect(body['code']).to eq('MEMBERSHIP_FROZEN')
      expect(body['renewal']).to be_nil
    end

    it 'returns not found when identifier does not match any member' do
      post '/api/v1/kiosk/check_in',
           params: { identifier: '0999999999' },
           headers: kiosk_headers

      expect(response).to have_http_status(:not_found)
      body = response.parsed_body
      expect(body['status']).to eq('denied')
      expect(body['code']).to eq('MEMBERSHIP_NOT_FOUND')
    end
  end

  describe 'GET /api/v1/kiosk/invoices/:id/status' do
    let!(:invoice) do
      session_pkg, = create_packages
      member = Membership.create!(
        shop: shop,
        package: session_pkg,
        customer_name: 'Member Test',
        phone: '0903334444'
      )
      member.invoices.create!(amount: 500_000, status: 'pending')
    end

    it 'returns invoice status' do
      get "/api/v1/kiosk/invoices/#{invoice.id}/status", headers: kiosk_headers

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['id']).to eq(invoice.id)
      expect(body['status']).to eq('pending')
    end

    it 'returns 404 for nonexistent invoice' do
      get "/api/v1/kiosk/invoices/#{SecureRandom.uuid}/status", headers: kiosk_headers

      expect(response).to have_http_status(:not_found)
    end
  end
end
