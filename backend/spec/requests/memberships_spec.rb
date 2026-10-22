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
        'sessions_left' => 3,
        'status' => 'expiring',
        'checked_in_today' => false,
        'last_checked_in_at' => nil
      )
      expect(memberships.first['package']).to include('id' => package.id, 'name' => '10-session massage')
      expect(memberships.first['expires_at']).to eq((Date.current + 30.days).iso8601)
    end

    it 'returns checked_in_today true when member checked in today' do
      staff = Staff.create!(shop: shop, name: 'Receptionist', role: 'staff')
      CheckIn.create!(membership: hoa, staff: staff, checked_in_at: Time.current)

      get '/memberships', params: { query: 'hoa' }, headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      member = response.parsed_body['memberships'].first
      expect(member['checked_in_today']).to be true
      expect(member['last_checked_in_at']).to be_present
    end

    it 'searches by phone within current_shop' do
      get '/memberships', params: { query: '0911' }, headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['memberships'].pluck('id')).to eq([lan.id])
    end

    it 'searches by partial phone number (last digits)' do
      get '/memberships', params: { query: '0000' }, headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['memberships'].pluck('id')).to eq([hoa.id])
    end

    it 'handles query string with surrounding whitespace' do
      get '/memberships', params: { query: '  0902000000  ' }, headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['memberships'].pluck('id')).to eq([hoa.id])
    end

    it 'searches by formatted phone number with spaces or dashes' do
      get '/memberships', params: { query: '090 200 0000' }, headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['memberships'].pluck('id')).to eq([hoa.id])

      get '/memberships', params: { query: '090-200-0000' }, headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['memberships'].pluck('id')).to eq([hoa.id])
    end

    it 'searches by membership ID within current_shop' do
      get '/memberships', params: { query: hoa.id }, headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['memberships'].pluck('id')).to eq([hoa.id])
    end

    it 'searches by PUNCHBOOK:id formatted QR value within current_shop' do
      get '/memberships', params: { query: "PUNCHBOOK:#{hoa.id}" }, headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['memberships'].pluck('id')).to eq([hoa.id])
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

    context 'with sort=checkin_priority' do
      it 'returns unchecked-in active members first, checked-in second, exhausted last' do
        staff = Staff.create!(shop: shop, name: 'Receptionist', role: 'staff')
        day_package = Package.create!(shop: shop, name: 'Monthly gym', duration_days: 30, price: 500_000)
        Membership.create!(
          shop: shop, package: package, customer_name: 'Alpha Exhausted',
          phone: '0900000001', sessions_left: 0
        )
        Membership.create!(
          shop: shop, package: day_package, customer_name: 'Beta Expired Day',
          phone: '0900000002', sessions_left: nil, expires_at: Date.current - 5.days
        )
        CheckIn.create!(membership: hoa, staff: staff, checked_in_at: Time.current)

        get '/memberships', params: { sort: 'checkin_priority' }, headers: auth_headers(shop)

        expect(response).to have_http_status(:ok)
        names = response.parsed_body['memberships'].pluck('customer_name')

        expect(names.index('Lan Tran')).to be < names.index('Hoa Nguyen')
        expect(names.index('Hoa Nguyen')).to be < names.index('Alpha Exhausted')
        expect(names.index('Hoa Nguyen')).to be < names.index('Beta Expired Day')
      end

      it 'falls back to alphabetical order when sort is not checkin_priority' do
        get '/memberships', headers: auth_headers(shop)

        expect(response).to have_http_status(:ok)
        names = response.parsed_body['memberships'].pluck('customer_name')
        expect(names).to eq(names.sort)
      end
    end

    context 'with status=not_checked_in' do
      it 'returns only eligible members who have not checked in today' do
        staff = Staff.create!(shop: shop, name: 'Receptionist', role: 'staff')
        day_package = Package.create!(shop: shop, name: 'Monthly gym', duration_days: 30, price: 500_000)
        Membership.create!(
          shop: shop, package: package, customer_name: 'Exhausted Zero',
          phone: '0900000003', sessions_left: 0
        )
        Membership.create!(
          shop: shop, package: day_package, customer_name: 'Expired Past',
          phone: '0900000004', sessions_left: nil, expires_at: Date.current - 1.day
        )
        CheckIn.create!(membership: hoa, staff: staff, checked_in_at: Time.current)

        get '/memberships', params: { status: 'not_checked_in' }, headers: auth_headers(shop)

        expect(response).to have_http_status(:ok)
        names = response.parsed_body['memberships'].pluck('customer_name')

        expect(names).to include('Lan Tran')
        expect(names).not_to include('Hoa Nguyen')
        expect(names).not_to include('Exhausted Zero')
        expect(names).not_to include('Expired Past')
      end
    end

    context 'with status=deleted' do
      it 'returns 403 when requested by non-admin staff' do
        staff = Staff.create!(shop: shop, name: 'Staff User', username: 'staff_del', password: 'password123',
                              role: 'staff')
        token = JsonWebToken.encode({ shop_id: shop.id, staff_id: staff.id, role: 'staff' })

        get '/memberships', params: { status: 'deleted' }, headers: { 'Authorization' => "Bearer #{token}" }

        expect(response).to have_http_status(:forbidden)
      end

      it 'returns only discarded memberships for admin' do
        hoa.discard

        get '/memberships', params: { status: 'deleted' }, headers: auth_headers(shop)

        expect(response).to have_http_status(:ok)
        ids = response.parsed_body['memberships'].pluck('id')
        expect(ids).to eq([hoa.id])
        expect(response.parsed_body['memberships'].first['status']).to eq('deleted')
      end
    end
  end

  describe 'GET /memberships/:id' do
    it 'returns 401 when unauthenticated' do
      get "/memberships/#{hoa.id}"

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns membership details with check-ins and invoices sorted desc' do
      staff = Staff.create!(shop: shop, name: 'Staff Member 1', role: 'staff')
      CheckIn.create!(membership: hoa, staff: staff, checked_in_at: 2.days.ago)
      hoa.update!(notes: 'Khách dị ứng tinh dầu sả')
      latest_check_in = CheckIn.create!(membership: hoa, staff: staff, checked_in_at: 1.hour.ago)
      invoice = Invoice.create!(membership: hoa, amount: 1_000_000, status: 'paid', payos_transaction_id: 'P123')

      get "/memberships/#{hoa.id}", headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body['membership']

      expect(body).to include('id' => hoa.id, 'customer_name' => 'Hoa Nguyen', 'phone' => '0902000000',
                              'notes' => 'Khách dị ứng tinh dầu sả',
                              'status' => 'expiring', 'qr_code_value' => "PUNCHBOOK:#{hoa.id}")
      expect(body['shop']).to include('id' => shop.id, 'name' => 'Lan Spa')
      expect(body['package']).to include('id' => package.id, 'name' => '10-session massage', 'price' => 1_000_000)

      expect(body['check_ins'].first).to include('id' => latest_check_in.id,
                                                 'staff' => {
                                                   'id' => staff.id, 'name' => 'Staff Member 1'
                                                 })
      expect(body['invoices'].first).to include('id' => invoice.id, 'amount' => 1_000_000, 'status' => 'paid',
                                                'payos_transaction_id' => 'P123')
    end

    it 'returns 404 for a membership belonging to another shop' do
      other_shop = create_shop(name: 'Other Spa', email: 'other@example.com')
      other_package = Package.create!(shop: other_shop, name: 'Secret package', sessions_count: 5, price: 500_000)
      other_member = Membership.create!(
        shop: other_shop,
        package: other_package,
        customer_name: 'Hoa Secret',
        phone: '0902000000',
        sessions_left: 9
      )

      get "/memberships/#{other_member.id}", headers: auth_headers(shop)

      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /memberships' do
    it 'returns 401 when unauthenticated' do
      post '/memberships', params: {
        membership: { customer_name: 'Mai Le', phone: '0903000000', package_id: package.id }
      }

      expect(response).to have_http_status(:unauthorized)
    end

    it 'creates a session-based membership with sessions_left from package' do
      payload = {
        membership: {
          customer_name: 'Mai Le',
          phone: '0903000000',
          package_id: package.id
        }
      }

      expect do
        post '/memberships', params: payload, headers: auth_headers(shop)
      end.to change(Membership, :count).by(1)

      expect(response).to have_http_status(:created)
      body = response.parsed_body['membership']
      expect(body).to include(
        'customer_name' => 'Mai Le',
        'phone' => '0903000000',
        'sessions_left' => 10
      )
      expect(body['package']).to include('id' => package.id, 'name' => '10-session massage')
      expect(Membership.find(body['id'])).to have_attributes(shop_id: shop.id, sessions_left: 10)
    end

    it 'creates a day-based membership with expires_at from package duration' do
      day_package = Package.create!(shop: shop, name: 'Monthly gym', duration_days: 30, price: 500_000)
      payload = {
        membership: {
          customer_name: 'Tuan Pham',
          phone: '0904000000',
          package_id: day_package.id
        }
      }

      expect do
        post '/memberships', params: payload, headers: auth_headers(shop)
      end.to change(Membership, :count).by(1)

      expect(response).to have_http_status(:created)
      body = response.parsed_body['membership']
      expect(body).to include(
        'customer_name' => 'Tuan Pham',
        'phone' => '0904000000',
        'sessions_left' => nil,
        'expires_at' => (Date.current + 30.days).iso8601
      )
    end

    it 'creates a membership with optional notes' do
      payload = {
        membership: {
          customer_name: 'Lan Anh',
          phone: '0909999999',
          package_id: package.id,
          notes: 'Lịch tập ưu tiên ca sáng'
        }
      }

      post '/memberships', params: payload, headers: auth_headers(shop)

      expect(response).to have_http_status(:created)
      created_id = response.parsed_body['membership']['id']
      expect(response.parsed_body['membership']['notes']).to eq('Lịch tập ưu tiên ca sáng')
      expect(Membership.find(created_id).notes).to eq('Lịch tập ưu tiên ca sáng')
    end

    it 'returns 422 when customer_name is blank' do
      post '/memberships',
           params: { membership: { customer_name: '', phone: '0903000000', package_id: package.id } },
           headers: auth_headers(shop)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['errors']).to be_present
    end

    it 'returns 404 when package belongs to another shop' do
      other_shop = create_shop(name: 'Other Spa', email: 'other@example.com')
      other_package = Package.create!(shop: other_shop, name: 'Secret', sessions_count: 5, price: 100_000)

      expect do
        post '/memberships',
             params: {
               membership: {
                 customer_name: 'Mai Le',
                 phone: '0903000000',
                 package_id: other_package.id
               }
             },
             headers: auth_headers(shop)
      end.not_to change(Membership, :count)

      expect(response).to have_http_status(:not_found)
    end

    context 'when enforcing plan limits' do
      it 'blocks creating 16th membership for free shop and returns upgrade error' do
        free_shop = create_shop(name: 'Free Shop', email: 'freeshop@example.com', plan: 'free')
        free_pkg = Package.create!(shop: free_shop, name: 'Pkg', sessions_count: 10, price: 100_000)

        15.times do |i|
          Membership.create!(
            shop: free_shop,
            package: free_pkg,
            customer_name: "Customer #{i + 1}",
            phone: "09800000#{i.to_s.rjust(2, '0')}"
          )
        end

        expect do
          post '/memberships',
               params: {
                 membership: {
                   customer_name: 'Customer 16',
                   phone: '0980000016',
                   package_id: free_pkg.id
                 }
               },
               headers: auth_headers(free_shop)
        end.not_to change(Membership, :count)

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body['errors']).to include(
          'Gói Free chỉ được tạo tối đa 15 hội viên. Vui lòng nâng cấp gói trả phí để tạo thêm hội viên.'
        )
      end

      it 'allows creating 16th membership for paid shop' do
        paid_shop = create_shop(name: 'Paid Shop', email: 'paidshop@example.com', plan: 'paid')
        paid_pkg = Package.create!(shop: paid_shop, name: 'Pkg', sessions_count: 10, price: 100_000)

        15.times do |i|
          Membership.create!(
            shop: paid_shop,
            package: paid_pkg,
            customer_name: "Customer #{i + 1}",
            phone: "09800000#{i.to_s.rjust(2, '0')}"
          )
        end

        expect do
          post '/memberships',
               params: {
                 membership: {
                   customer_name: 'Customer 16',
                   phone: '0980000016',
                   package_id: paid_pkg.id
                 }
               },
               headers: auth_headers(paid_shop)
        end.to change(Membership, :count).by(1)

        expect(response).to have_http_status(:created)
      end
    end
  end

  describe 'PATCH /memberships/:id' do
    it 'returns 401 when unauthenticated' do
      patch "/memberships/#{hoa.id}", params: { membership: { customer_name: 'Hoa Updated' } }

      expect(response).to have_http_status(:unauthorized)
    end

    it 'updates customer_name, phone, and sessions_left successfully' do
      patch "/memberships/#{hoa.id}",
            params: {
              membership: {
                customer_name: 'Hoa Nguyen Updated',
                phone: '0999888777',
                sessions_left: 5
              }
            },
            headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body['membership']
      expect(body['customer_name']).to eq('Hoa Nguyen Updated')
      expect(body['phone']).to eq('0999888777')
      expect(body['sessions_left']).to eq(5)
      expect(body['qr_code_value']).to eq("PUNCHBOOK:#{hoa.id}")

      hoa.reload
      expect(hoa.customer_name).to eq('Hoa Nguyen Updated')
      expect(hoa.phone).to eq('0999888777')
      expect(hoa.sessions_left).to eq(5)
    end

    it 'updates notes successfully' do
      patch "/memberships/#{hoa.id}",
            params: {
              membership: {
                notes: 'Yêu cầu đặc biệt: không dùng dầu dừa'
              }
            },
            headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['membership']['notes']).to eq('Yêu cầu đặc biệt: không dùng dầu dừa')
      expect(hoa.reload.notes).to eq('Yêu cầu đặc biệt: không dùng dầu dừa')
    end

    it 'returns 404 when membership belongs to another shop' do
      other_shop = create_shop(name: 'Other Spa', email: 'other@example.com')
      other_pkg = Package.create!(shop: other_shop, name: 'Pkg', sessions_count: 5, price: 100_000)
      other_member = Membership.create!(
        shop: other_shop, package: other_pkg, customer_name: 'Other', phone: '0900000000'
      )

      patch "/memberships/#{other_member.id}",
            params: { membership: { customer_name: 'Hacked' } },
            headers: auth_headers(shop)

      expect(response).to have_http_status(:not_found)
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

    it 'checks in with default shop staff when staff_id is missing without creating new staff' do
      headers = auth_headers(shop)
      initial_staff_count = shop.staffs.count

      expect do
        post "/memberships/#{hoa.id}/check_in", headers: headers
      end.to change(CheckIn, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig('membership', 'id')).to eq(hoa.id)
      expect(shop.staffs.count).to eq(initial_staff_count)
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

  describe 'GET /memberships/export' do
    it 'returns 401 when unauthenticated' do
      get '/memberships/export'

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns 403 when requested by non-admin staff' do
      staff = Staff.create!(
        shop: shop, name: 'Staff User', username: 'staff1', password: 'password123', role: 'staff'
      )
      token = JsonWebToken.encode({ shop_id: shop.id, staff_id: staff.id, role: 'staff' })

      get '/memberships/export', headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:forbidden)
    end

    it 'returns 200 with an XLSX attachment when requested by admin' do
      get '/memberships/export', headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.headers['Content-Type']).to include(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(response.headers['Content-Disposition']).to include('attachment; filename="memberships_')
      expect(response.body.bytesize).to be > 0
    end

    it 'filters exported memberships by status and query params' do
      get '/memberships/export', params: { query: 'Hoa', status: 'expiring' }, headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      doc = Roo::Excelx.new(StringIO.new(response.body))
      names = (2..doc.sheet(0).last_row).map { |r| doc.sheet(0).cell(r, 1) }
      expect(names).to contain_exactly('Hoa Nguyen')
    end
  end

  describe 'GET /memberships/import_template' do
    it 'returns 401 when unauthenticated' do
      get '/memberships/import_template'

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns Excel template binary stream' do
      get '/memberships/import_template', headers: auth_headers(shop)

      expect(response.headers['Content-Type']).to include(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(response.headers['Content-Disposition']).to include('filename="template_import_memberships.xlsx"')
      expect(response.body.bytesize).to be > 0
    end
  end

  describe 'POST /memberships/import' do
    it 'returns 401 when unauthenticated' do
      post '/memberships/import'

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns 422 when file parameter is missing' do
      post '/memberships/import', headers: auth_headers(shop)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body['error']).to eq('Vui lòng chọn file để import')
    end

    it 'imports members from uploaded Excel file and returns json report' do
      Package.create!(shop: shop, name: 'Gói 10 buổi', sessions_count: 10, price: 100_000)
      xlsx_package = Axlsx::Package.new
      xlsx_package.workbook.add_worksheet(name: 'Members') do |sheet|
        sheet.add_row ['Tên hội viên', 'Số điện thoại', 'Gói cước']
        sheet.add_row ['Imported User', '0988776655', 'Gói 10 buổi']
      end
      temp_file = Tempfile.new(['import', '.xlsx'])
      xlsx_package.serialize(temp_file.path)

      file = fixture_file_upload(temp_file.path, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

      expect do
        post '/memberships/import', params: { file: file }, headers: auth_headers(shop)
      end.to change(Membership, :count).by(1)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['total_rows']).to eq(1)
      expect(body['success_count']).to eq(1)
      expect(body['failed_count']).to eq(0)
      expect(body['errors']).to be_empty
    end
  end

  describe 'DELETE /memberships/:id' do
    it 'soft deletes the membership' do
      delete "/memberships/#{hoa.id}", headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(hoa.reload).to be_discarded
    end
  end

  describe 'POST /memberships/:id/restore' do
    it 'returns 403 when requested by non-admin staff' do
      hoa.discard
      staff = Staff.create!(shop: shop, name: 'Staff User', username: 'staff_rst', password: 'password123',
                            role: 'staff')
      token = JsonWebToken.encode({ shop_id: shop.id, staff_id: staff.id, role: 'staff' })

      post "/memberships/#{hoa.id}/restore", headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:forbidden)
      expect(hoa.reload).to be_discarded
    end

    it 'restores discarded membership when requested by admin' do
      hoa.discard
      expect(hoa.reload).to be_discarded

      post "/memberships/#{hoa.id}/restore", headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['message']).to eq('Đã khôi phục hội viên thành công')
      expect(hoa.reload).not_to be_discarded
      expect(hoa.status).to eq('expiring')
    end

    it 'returns 404 when membership is not discarded or does not exist' do
      post "/memberships/#{hoa.id}/restore", headers: auth_headers(shop)

      expect(response).to have_http_status(:not_found)
    end
  end
end
