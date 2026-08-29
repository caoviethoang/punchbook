# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ExcelReportGenerator do
  subject(:generator) { described_class.new(shop: shop) }

  let(:shop) { create_shop(plan: 'paid') }
  let(:package) { Package.create!(shop: shop, name: 'VIP 10 Buổi', sessions_count: 10, price: 500_000) }
  let(:staff) { Staff.create!(shop: shop, name: 'Nhân viên 1', role: 'staff') }

  describe '#call' do
    it 'generates a valid binary XLSX stream containing the shop data' do
      membership = Membership.create!(
        shop: shop, package: package, customer_name: 'Khách Hàng A', phone: '0901234567', sessions_left: 5
      )
      Invoice.create!(membership: membership, amount: 500_000, status: 'paid', payos_transaction_id: 'payos_tx_123')
      CheckIn.create!(membership: membership, staff: staff, checked_in_at: Time.current)

      output = generator.call

      expect(output).to be_a(String)
      expect(output.encoding).to eq(Encoding::ASCII_8BIT)
      expect(output.bytesize).to be > 0
    end
  end
end

