# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Memberships', type: :request do
  let!(:shop) { create_shop(name: 'Lan Spa', email: 'lan@example.com') }
  let!(:package) do
    Package.create!(shop: shop, name: '10-session massage', sessions_count: 10, price: 1_000_000)
  end
  let!(:hoa) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'Hoa Nguyen',
      phone: '0902000000',
      sessions_left: 3,
      expires_at: Date.current + 30.days
    )
  end
  let!(:lan) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'Lan Tran',
      phone: '0911111111',
      sessions_left: 1
    )
  end

  describe 'GET /memberships' do
    it 'returns 401 when unauthenticated' do
      get '/memberships'

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns only current_shop memberships when query is blank (limited list)' do
      other_shop = create_shop(name: 'Other Spa', email: 'other@example.com')
      other_package = Package.create!(shop: other_shop, name: 'Secret package', sessions_count: 5, price: 500_000)
      other_member = Membership.create!(
        shop: other_shop,
        package: other_package,
        customer_name: 'Hoa Secret',
        phone: '0902000000',
        sessions_left: 9
      )

      get '/memberships', headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      ids = response.parsed_body['memberships'].pluck('id')
      expect(ids).to contain_exactly(hoa.id, lan.id)
      expect(ids).not_to include(other_member.id)
    end

    it 'searches by customer_name (ILIKE) within current_shop' do
      get '/memberships', params: { query: 'hoa' }, headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      memberships = response.parsed_body['memberships']
      expect(memberships.size).to eq(1)
      expect(memberships.first).to include(
        'id' => hoa.id,
        'customer_name' => 'Hoa Nguyen',
        'phone' => '0902000000',
        'sessions_left' => 3
      )
      expect(memberships.first['package']).to eq('id' => package.id, 'name' => '10-session massage')
      expect(memberships.first['expires_at']).to eq((Date.current + 30.days).iso8601)
    end

    it 'searches by phone within current_shop' do
      get '/memberships', params: { query: '0911' }, headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['memberships'].pluck('id')).to eq([lan.id])
    end

    it 'does not return another shop membership even when name/phone match' do
      other_shop = create_shop(name: 'Other Spa', email: 'other@example.com')
      other_package = Package.create!(shop: other_shop, name: 'Secret package', sessions_count: 5, price: 500_000)
      other_member = Membership.create!(
        shop: other_shop,
        package: other_package,
        customer_name: 'Hoa Secret',
        phone: '0902000000',
        sessions_left: 9
      )

      get '/memberships', params: { query: 'Hoa' }, headers: auth_headers(shop)

      ids = response.parsed_body['memberships'].pluck('id')
      expect(ids).to eq([hoa.id])
      expect(ids).not_to include(other_member.id)
    end

    it 'returns an empty list when nothing matches' do
      get '/memberships', params: { query: 'zzzz-no-match' }, headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['memberships']).to eq([])
    end
  end

  describe 'POST /memberships/:id/check_in' do
    let!(:staff) { Staff.create!(shop: shop, name: 'Mai', role: 'staff') }

    it 'returns 401 when unauthenticated' do
      post "/memberships/#{hoa.id}/check_in", params: { staff_id: staff.id }

      expect(response).to have_http_status(:unauthorized)
    end

    it 'checks in successfully, decrements sessions_left, and returns check_in' do
      expect do
        post "/memberships/#{hoa.id}/check_in",
             params: { staff_id: staff.id },
             headers: auth_headers(shop)
      end.to change(CheckIn, :count).by(1)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body.dig('membership', 'id')).to eq(hoa.id)
      expect(body.dig('membership', 'sessions_left')).to eq(2)
      expect(body.dig('check_in', 'id')).to be_present
      expect(body.dig('check_in', 'checked_in_at')).to be_present
      expect(hoa.reload.sessions_left).to eq(2)
    end

    it 'returns 422 when out of sessions and does not create a CheckIn' do
      hoa.update!(sessions_left: 0)

      expect do
        post "/memberships/#{hoa.id}/check_in",
             params: { staff_id: staff.id },
             headers: auth_headers(shop)
      end.not_to change(CheckIn, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['error']).to eq('Membership has no sessions left')
      expect(hoa.reload.sessions_left).to eq(0)
    end

    it 'returns 422 when day-based membership is expired' do
      day_package = Package.create!(shop: shop, name: 'Monthly gym', duration_days: 30, price: 500_000)
      member = Membership.create!(
        shop: shop,
        package: day_package,
        customer_name: 'Expired Member',
        phone: '0922222222',
        sessions_left: nil,
        expires_at: Date.current - 1.day
      )

      expect do
        post "/memberships/#{member.id}/check_in",
             params: { staff_id: staff.id },
             headers: auth_headers(shop)
      end.not_to change(CheckIn, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['error']).to eq('Membership has expired')
    end

    it 'returns 422 when staff_id is missing' do
      post "/memberships/#{hoa.id}/check_in", headers: auth_headers(shop)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['error']).to be_present
    end

    it 'returns 404 for another shop membership and does not check in' do
      other_shop = create_shop(name: 'Other Spa', email: 'other@example.com')
      other_package = Package.create!(shop: other_shop, name: 'Secret package', sessions_count: 5, price: 500_000)
      other_member = Membership.create!(
        shop: other_shop,
        package: other_package,
        customer_name: 'Hoa Secret',
        phone: '0902000000',
        sessions_left: 9
      )

      expect do
        post "/memberships/#{other_member.id}/check_in",
             params: { staff_id: staff.id },
             headers: auth_headers(shop)
      end.not_to change(CheckIn, :count)

      expect(response).to have_http_status(:not_found)
      expect(other_member.reload.sessions_left).to eq(9)
    end

    it 'returns 404 when staff belongs to another shop' do
      other_shop = create_shop(name: 'Other Spa', email: 'other@example.com')
      other_staff = Staff.create!(shop: other_shop, name: 'Other', role: 'staff')

      post "/memberships/#{hoa.id}/check_in",
           params: { staff_id: other_staff.id },
           headers: auth_headers(shop)

      expect(response).to have_http_status(:not_found)
      expect(hoa.reload.sessions_left).to eq(3)
    end
  end
end
