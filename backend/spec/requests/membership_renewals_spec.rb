# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MembershipRenewals', type: :request do
  let!(:shop) { create_shop(name: 'Yoga Harmony', email: 'harmony@example.com') }
  let!(:staff) { Staff.create!(shop: shop, name: 'Coach Linh', role: 'staff') }
  let!(:package_ten) do
    Package.create!(shop: shop, name: 'Yoga 10 Buổi', sessions_count: 10, price: 1_200_000)
  end
  let!(:package_twenty) do
    Package.create!(shop: shop, name: 'Yoga 20 Buổi', sessions_count: 20, price: 2_000_000)
  end
  let!(:expired_member) do
    Membership.create!(
      shop: shop,
      package: package_ten,
      customer_name: 'Tran Thi B',
      phone: '0909000111',
      sessions_left: 0
    )
  end

  describe 'POST /memberships/:id/renew' do
    it 'returns 401 when unauthenticated' do
      post "/memberships/#{expired_member.id}/renew"

      expect(response).to have_http_status(:unauthorized)
    end

    it 'renews membership and optionally auto-checks in' do
      post "/memberships/#{expired_member.id}/renew",
           params: { auto_check_in: true, staff_id: staff.id },
           headers: auth_headers(shop),
           as: :json

      expect(response).to have_http_status(:ok)
      json = response.parsed_body

      expect(json['membership']['sessions_left']).to eq(9) # 10 - 1
      expect(json['invoice']['status']).to eq('paid')
      expect(json['invoice']['amount']).to eq(1_200_000)
      expect(json['check_in']).to be_present

      expect(expired_member.reload.sessions_left).to eq(9)
      expect(CheckIn.where(membership: expired_member).count).to eq(1)
    end

    it 'renews membership with a newly selected package' do
      post "/memberships/#{expired_member.id}/renew",
           params: { package_id: package_twenty.id, auto_check_in: false },
           headers: auth_headers(shop),
           as: :json

      expect(response).to have_http_status(:ok)
      json = response.parsed_body

      expect(json['membership']['package']['id']).to eq(package_twenty.id)
      expect(json['membership']['sessions_left']).to eq(20)
      expect(json['check_in']).to be_nil
      expect(expired_member.reload.package_id).to eq(package_twenty.id)
    end
  end
end

