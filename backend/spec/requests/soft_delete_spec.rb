# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Soft Delete (Discard)', type: :request do
  let!(:shop) { Shop.create!(name: 'Test Shop', email: 'owner@test.com', password: 'password123', plan: 'paid') }
  let!(:package) { Package.create!(shop: shop, name: 'Standard Package', price: 500_000, sessions_count: 10) }
  let!(:membership) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'John Doe',
      phone: '0901234567',
      sessions_left: 10
    )
  end
  let!(:staff) { Staff.create!(shop: shop, name: 'Staff User', role: 'staff') }
  let(:headers) { auth_headers(shop) }

  describe 'DELETE /memberships/:id' do
    it 'soft deletes the membership by setting discarded_at' do
      expect do
        delete "/memberships/#{membership.id}", headers: headers
      end.not_to change(Membership.with_discarded, :count)

      expect(response).to have_http_status(:ok)
      expect(membership.reload.discarded_at).not_to be_nil
      expect(membership.discarded?).to be true
    end

    it 'excludes discarded memberships from GET /memberships by default' do
      delete "/memberships/#{membership.id}", headers: headers

      get '/memberships', headers: headers
      expect(response).to have_http_status(:ok)

      json = response.parsed_body
      member_ids = json['memberships'].pluck('id')
      expect(member_ids).not_to include(membership.id)
    end

    it 'preserves associated invoices and check-ins when membership is discarded' do
      invoice = Invoice.create!(membership: membership, amount: 500_000, status: 'paid')
      check_in = CheckIn.create!(membership: membership, staff: staff, checked_in_at: Time.current)

      delete "/memberships/#{membership.id}", headers: headers

      expect(invoice.reload.membership).to eq(membership)
      expect(check_in.reload.membership).to eq(membership)
    end
  end

  describe 'DELETE /packages/:id' do
    it 'soft deletes the package by setting discarded_at' do
      expect do
        delete "/packages/#{package.id}", headers: headers
      end.not_to change(Package.with_discarded, :count)

      expect(response).to have_http_status(:ok)
      expect(package.reload.discarded_at).not_to be_nil
      expect(package.discarded?).to be true
    end

    it 'excludes discarded packages from GET /packages by default' do
      delete "/packages/#{package.id}", headers: headers

      get '/packages', headers: headers
      expect(response).to have_http_status(:ok)

      json = response.parsed_body
      pkg_ids = json['packages'].pluck('id')
      expect(pkg_ids).not_to include(package.id)
    end

    it 'allows existing memberships to still access discarded package' do
      delete "/packages/#{package.id}", headers: headers

      expect(membership.reload.package).to eq(package)
    end
  end
end
