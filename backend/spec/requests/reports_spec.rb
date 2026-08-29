# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Reports Export', type: :request do
  let(:paid_shop) { create_shop(name: 'Lan Spa Paid', email: 'paid@example.com', plan: 'paid') }
  let(:free_shop) { create_shop(name: 'Free Spa', email: 'free@example.com', plan: 'free') }

  let(:package) { Package.create!(shop: paid_shop, name: '10-session massage', sessions_count: 10, price: 1_000_000) }

  describe 'GET /reports/export' do
    it 'returns 401 when unauthenticated' do
      get '/reports/export'

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns 403 when shop is on free plan' do
      get '/reports/export', headers: auth_headers(free_shop)

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body['error']).to include('Gói Free không hỗ trợ xuất báo cáo')
    end

    it 'returns 200 with an XLSX attachment when shop is on paid plan' do
      Membership.create!(
        shop: paid_shop,
        package: package,
        customer_name: 'Hoa Nguyen',
        phone: '0901234567',
        sessions_left: 5
      )

      get '/reports/export', headers: auth_headers(paid_shop)

      expect(response).to have_http_status(:ok)
      expect(response.headers['Content-Type']).to eq(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(response.headers['Content-Disposition']).to include('attachment; filename=')
      expect(response.body.bytesize).to be > 0
    end
  end
end
