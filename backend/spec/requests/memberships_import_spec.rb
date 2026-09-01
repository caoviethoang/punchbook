# frozen_string_literal: true

require 'rails_helper'
require 'caxlsx'

RSpec.describe 'Memberships Import API', type: :request do
  let(:shop) { create_shop(name: 'Lan Spa Import', email: 'import@example.com', plan: 'paid') }
  let(:package) do
    Package.create!(shop: shop, name: 'Gói 10 Buổi', sessions_count: 10, price: 500_000)
  end

  before { package }

  describe 'GET /memberships/template' do
    it 'returns 401 when unauthenticated' do
      get '/memberships/template'

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns 200 with an XLSX template attachment' do
      get '/memberships/template', headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(response.headers['Content-Type']).to eq(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(response.headers['Content-Disposition']).to include(
        'attachment; filename="template_import_memberships.xlsx"'
      )
      expect(response.body.bytesize).to be > 0
    end
  end

  describe 'POST /memberships/import' do
    it 'returns 401 when unauthenticated' do
      post '/memberships/import'

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns 400 when file is missing' do
      post '/memberships/import', headers: auth_headers(shop)

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['error']).to include('Vui lòng chọn file')
    end

    it 'imports memberships from uploaded CSV file and returns detailed report' do
      csv_file = Tempfile.new(['import', '.csv'])
      CSV.open(csv_file.path, 'w') do |csv|
        csv << ['Tên hội viên', 'Số điện thoại', 'Gói cước', 'Số buổi còn lại', 'Ngày hết hạn']
        csv << ['Khách 1', '0901234567', 'Gói 10 Buổi', '10', '']
        csv << ['Khách 2', '0912345678', 'Gói 10 Buổi', '5', '']
        csv << ['Khách Lỗi', '', 'Gói 10 Buổi', '5', ''] # missing phone
      end

      uploaded_file = Rack::Test::UploadedFile.new(csv_file.path, 'text/csv', original_filename: 'import.csv')

      post '/memberships/import',
           params: { file: uploaded_file },
           headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body

      expect(body['success']).to be false
      expect(body['total_rows']).to eq(3)
      expect(body['success_count']).to eq(2)
      expect(body['error_count']).to eq(1)
      expect(body['errors'].first['row']).to eq(4)
      expect(body['errors'].first['message']).to include('Số điện thoại không được để trống')
      expect(body['memberships'].size).to eq(2)

      csv_file.close
      csv_file.unlink
    end

    it 'imports memberships from uploaded XLSX file' do
      xlsx_file = Tempfile.new(['import', '.xlsx'])
      axlsx = Axlsx::Package.new
      axlsx.workbook.add_worksheet(name: 'Danh sách') do |sheet|
        sheet.add_row ['Tên hội viên', 'Số điện thoại', 'Gói cước', 'Số buổi còn lại', 'Ngày hết hạn']
        sheet.add_row ['Khách Excel', '0933334444', 'Gói 10 Buổi', 8, '']
      end
      axlsx.serialize(xlsx_file.path)

      uploaded_file = Rack::Test::UploadedFile.new(
        xlsx_file.path,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        original_filename: 'import.xlsx'
      )

      post '/memberships/import',
           params: { file: uploaded_file },
           headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body

      expect(body['success']).to be true
      expect(body['success_count']).to eq(1)
      expect(body['memberships'].first['customer_name']).to eq('Khách Excel')

      xlsx_file.close
      xlsx_file.unlink
    end
  end
end
