# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ImportMembershipsTemplateGenerator do
  subject(:generator) { described_class.new(shop: shop) }

  let(:shop) { create_shop(plan: 'paid') }
  let(:session_pkg) { Package.create!(shop: shop, name: 'Gói 10 Buổi', sessions_count: 10, price: 500_000) }
  let(:day_pkg) { Package.create!(shop: shop, name: 'Gói 1 Tháng', duration_days: 30, price: 800_000) }

  describe '#call' do
    it 'generates a valid binary XLSX stream containing template headers and instructions' do
      session_pkg
      day_pkg
      output = generator.call

      expect(output).to be_a(String)
      expect(output.encoding).to eq(Encoding::ASCII_8BIT)
      expect(output.bytesize).to be > 0

      # Verify it can be parsed back with Roo
      tempfile = Tempfile.new(['template', '.xlsx'])
      tempfile.binmode
      tempfile.write(output)
      tempfile.rewind

      xlsx = Roo::Excelx.new(tempfile.path)
      expect(xlsx.sheets).to include('Danh sách hội viên', 'Hướng dẫn')

      headers = xlsx.sheet('Danh sách hội viên').row(1)
      expect(headers).to eq(['Tên hội viên', 'Số điện thoại', 'Gói cước', 'Số buổi còn lại', 'Ngày hết hạn'])

      tempfile.close
      tempfile.unlink
    end

    it 'works when shop is nil' do
      output = described_class.call(shop: nil)
      expect(output).to be_a(String)
      expect(output.bytesize).to be > 0
    end
  end
end
