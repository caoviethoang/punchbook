# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'BatchCheckIns', type: :request do
  let!(:shop) { create_shop(name: 'Yoga Studio', email: 'yoga@example.com') }
  let!(:staff) { Staff.create!(shop: shop, name: 'Coach Linh', role: 'staff') }
  let!(:package) do
    Package.create!(shop: shop, name: 'Yoga 10 sessions', sessions_count: 10, price: 1_000_000)
  end
  let!(:alpha_member) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'Member Alpha',
      phone: '0901000001',
      sessions_left: 5
    )
  end
  let!(:beta_member) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'Member Beta',
      phone: '0901000002',
      sessions_left: 2
    )
  end

  describe 'POST /api/v1/memberships/batch_check_in' do
    it 'returns 401 when unauthenticated' do
      post '/api/v1/memberships/batch_check_in', params: { membership_ids: [alpha_member.id] }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['code']).to eq('UNAUTHORIZED')
    end

    it 'returns 422 when membership_ids is missing or empty' do
      post '/api/v1/memberships/batch_check_in',
           params: { membership_ids: [] },
           headers: auth_headers(shop),
           as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['error']).to include('Vui lòng chọn ít nhất một hội viên')
      expect(response.parsed_body['code']).to eq('MEMBERSHIPS_REQUIRED')
    end

    it 'performs batch check-in and returns summary' do
      post '/api/v1/memberships/batch_check_in',
           params: { membership_ids: [alpha_member.id, beta_member.id], staff_id: staff.id },
           headers: auth_headers(shop),
           as: :json

      expect(response).to have_http_status(:ok)
      json = response.parsed_body

      expect(json['total']).to eq(2)
      expect(json['success_count']).to eq(2)
      expect(json['failed_count']).to eq(0)
      expect(json['results'].length).to eq(2)

      expect(alpha_member.reload.sessions_left).to eq(4)
      expect(beta_member.reload.sessions_left).to eq(1)
      expect(CheckIn.where(membership: [alpha_member, beta_member]).count).to eq(2)
    end

    it 'handles other shop memberships without affecting them' do
      other_shop = create_shop(name: 'Other Shop', email: 'other@example.com')
      other_package = Package.create!(shop: other_shop, name: 'Other', sessions_count: 5, price: 500_000)
      other_member = Membership.create!(
        shop: other_shop,
        package: other_package,
        customer_name: 'Other Member',
        phone: '0909999999',
        sessions_left: 5
      )

      post '/api/v1/memberships/batch_check_in',
           params: { membership_ids: [alpha_member.id, other_member.id] },
           headers: auth_headers(shop),
           as: :json

      expect(response).to have_http_status(:ok)
      json = response.parsed_body

      expect(json['total']).to eq(2)
      expect(json['success_count']).to eq(1)
      expect(json['failed_count']).to eq(1)

      failed_item = json['results'].find { |r| r['membership_id'] == other_member.id }
      expect(failed_item['status']).to eq('failed')
      expect(failed_item['error']).to include('không tồn tại')
      expect(other_member.reload.sessions_left).to eq(5)
    end
  end
end
