# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Dashboard', type: :request do
  let!(:shop) { create_shop(name: 'Lan Spa', email: 'lan@example.com') }
  let!(:session_package) do
    Package.create!(shop: shop, name: '10-session massage', sessions_count: 10, price: 1_000_000)
  end
  let!(:day_package) do
    Package.create!(shop: shop, name: 'Monthly gym', duration_days: 30, price: 500_000)
  end

  describe 'GET /dashboard' do
    it 'returns 401 when unauthenticated' do
      get '/dashboard'

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns revenue, active count, and expiring count for current_shop only' do
      active = create_member(package: session_package, name: 'Hoa Nguyen', sessions_left: 5,
                             expires_at: Date.current + 30.days)
      expiring_day = create_member(package: day_package, name: 'Lan Tran', phone: '0911111111',
                                   sessions_left: nil, expires_at: Date.current + 3.days)
      create_member(package: session_package, name: 'Near Empty', phone: '0944444444', sessions_left: 2)
      create_member(package: session_package, name: 'Expired User', phone: '0922222222', sessions_left: 0)

      Invoice.create!(membership: active, amount: 1_000_000, status: 'paid')
      Invoice.create!(membership: expiring_day, amount: 500_000, status: 'paid')
      Invoice.create!(membership: active, amount: 200_000, status: 'pending')
      seed_other_shop_paid_invoice!

      get '/dashboard', headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['revenue_this_month']).to eq(1_500_000)
      expect(body['active_memberships_count']).to eq(3)
      # day-based within 7 days + session-based with sessions_left <= 3
      expect(body['expiring_within_7_days_count']).to eq(2)
    end

    it 'returns memberships with package and status, scoped to current_shop' do
      active = create_member(package: session_package, name: 'Hoa Nguyen', sessions_left: 5,
                             expires_at: Date.current + 30.days)
      create_member(package: day_package, name: 'Lan Tran', phone: '0911111111',
                    sessions_left: nil, expires_at: Date.current + 3.days)
      create_member(package: session_package, name: 'Expired User', phone: '0922222222', sessions_left: 0)
      seed_other_shop_paid_invoice!

      get '/dashboard', headers: auth_headers(shop)

      names = response.parsed_body['memberships'].pluck('customer_name')
      expect(names).to eq(['Expired User', 'Hoa Nguyen', 'Lan Tran'])
      expect(names).not_to include('Other Member')

      hoa = response.parsed_body['memberships'].find { |m| m['customer_name'] == 'Hoa Nguyen' }
      expect(hoa).to include('id' => active.id, 'sessions_left' => 5, 'status' => 'active')
      expect(hoa['package']).to eq('id' => session_package.id, 'name' => '10-session massage')
      expect(status_for('Lan Tran')).to eq('expiring')
      expect(status_for('Expired User')).to eq('expired')
    end

    it 'does not count paid invoices from other months' do
      member = create_member(package: session_package, name: 'Hoa Nguyen', sessions_left: 5)
      Invoice.create!(
        membership: member,
        amount: 1_000_000,
        status: 'paid',
        created_at: 2.months.ago,
        updated_at: 2.months.ago
      )

      get '/dashboard', headers: auth_headers(shop)

      expect(response.parsed_body['revenue_this_month']).to eq(0)
    end

    it 'does not N+1 query when memberships grow', :aggregate_failures do
      create_member(package: session_package, name: 'Member 1', phone: '0901000001', sessions_left: 5)

      queries_baseline = count_queries { get '/dashboard', headers: auth_headers(shop) }

      8.times do |i|
        create_member(package: session_package, name: "Member #{i + 2}", phone: "09010000#{format('%02d', i + 2)}",
                      sessions_left: i + 1)
      end

      queries_with_many = count_queries { get '/dashboard', headers: auth_headers(shop) }

      # Constant query count proves eager-loading is working — not one query per membership.
      # Allow a ±2 slack for incidental differences (e.g. SAVEPOINT in test transactions).
      expect(queries_with_many).to be_within(2).of(queries_baseline)
    end
  end

  def create_member(package:, name:, sessions_left:, phone: '0902000000', expires_at: nil)
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: name,
      phone: phone,
      sessions_left: sessions_left,
      expires_at: expires_at
    )
  end

  def seed_other_shop_paid_invoice!
    other_shop = create_shop(name: 'Other Spa', email: 'other@example.com')
    other_package = Package.create!(shop: other_shop, name: 'Secret', sessions_count: 5, price: 100_000)
    other_member = Membership.create!(
      shop: other_shop,
      package: other_package,
      customer_name: 'Other Member',
      phone: '0933333333',
      sessions_left: 4,
      expires_at: Date.current + 2.days
    )
    Invoice.create!(membership: other_member, amount: 9_999_999, status: 'paid')
  end

  def status_for(name)
    response.parsed_body['memberships'].find { |m| m['customer_name'] == name }['status']
  end
end
