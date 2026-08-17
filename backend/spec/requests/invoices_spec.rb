# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Invoices API', type: :request do
  let!(:shop) { create_shop(name: 'Lan Spa', email: 'lan@example.com') }
  let!(:package) { Package.create!(shop: shop, name: '10-session massage', sessions_count: 10, price: 1_000_000) }
  let!(:membership) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'Hoa Nguyen',
      phone: '0902000000',
      sessions_left: 3
    )
  end

  describe 'POST /memberships/:membership_id/invoices' do
    context 'when unauthenticated' do
      it 'returns 401 unauthorized' do
        post "/memberships/#{membership.id}/invoices"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'when membership belongs to another shop' do
      let!(:other_shop) { create_shop(name: 'Other Spa', email: 'other@example.com') }

      it 'returns 404 not found and creates no invoice' do
        expect do
          post "/memberships/#{membership.id}/invoices", headers: auth_headers(other_shop)
        end.not_to change(Invoice, :count)

        expect(response).to have_http_status(:not_found)
        expect(response.parsed_body['error']).to eq('Not found')
      end
    end

    context 'when payOS API call is successful' do
      before do
        stub_request(:post, 'https://api-merchant.payos.vn/v2/payment-requests')
          .to_return(
            status: 200,
            headers: { 'Content-Type' => 'application/json' },
            body: {
              code: '00',
              desc: 'success',
              data: {
                paymentLinkId: 'link_123456',
                checkoutUrl: 'https://pay.payos.vn/web/link_123456',
                qrCode: '00020101021238570010A00000072701270006970422'
              }
            }.to_json
          )
      end

      it 'creates a pending invoice, calls payOS, and returns checkout URL + QR code' do
        expect do
          post "/memberships/#{membership.id}/invoices", headers: auth_headers(shop)
        end.to change(Invoice, :count).by(1)

        expect(response).to have_http_status(:created)
        body = response.parsed_body

        invoice = Invoice.last
        expect(invoice.membership_id).to eq(membership.id)
        expect(invoice.amount).to eq(1_000_000)
        expect(invoice.status).to eq('pending')
        expect(invoice.payos_transaction_id).to eq('link_123456')
        expect(invoice.payos_checkout_url).to eq('https://pay.payos.vn/web/link_123456')

        expect(body.dig('invoice', 'id')).to eq(invoice.id)
        expect(body.dig('invoice', 'amount')).to eq(1_000_000)
        expect(body.dig('invoice', 'status')).to eq('pending')
        expect(body.dig('invoice', 'payos_transaction_id')).to eq('link_123456')
        expect(body.dig('invoice', 'payos_checkout_url')).to eq('https://pay.payos.vn/web/link_123456')

        expect(body.dig('payos', 'checkout_url')).to eq('https://pay.payos.vn/web/link_123456')
        expect(body.dig('payos', 'qr_code')).to eq('00020101021238570010A00000072701270006970422')
      end

      it 'allows overriding invoice amount via params' do
        post "/memberships/#{membership.id}/invoices",
             params: { invoice: { amount: 500_000 } },
             headers: auth_headers(shop)

        expect(response).to have_http_status(:created)
        expect(Invoice.last.amount).to eq(500_000)
      end
    end

    context 'when payOS API fails' do
      before do
        stub_request(:post, 'https://api-merchant.payos.vn/v2/payment-requests')
          .to_return(
            status: 200,
            headers: { 'Content-Type' => 'application/json' },
            body: {
              code: '20',
              desc: 'Invalid checksum'
            }.to_json
          )
      end

      it 'returns 422 unprocessable_content and rolls back invoice creation' do
        expect do
          post "/memberships/#{membership.id}/invoices", headers: auth_headers(shop)
        end.not_to change(Invoice, :count)

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body['error']).to include('payOS Error [20]: Invalid checksum')
      end
    end
  end
end
