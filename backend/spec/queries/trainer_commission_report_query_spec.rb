# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TrainerCommissionReportQuery do
  include ActiveSupport::Testing::TimeHelpers

  let(:shop) { Shop.create!(name: 'PT Studio', email: 'pt@studio.com', password: 'password123', plan: 'paid') }
  let(:trainer_kiet) { shop.staffs.create!(name: 'HLV Tuan Kiet', role: 'trainer') }
  let(:trainer_lan) { shop.staffs.create!(name: 'HLV Lan Anh', role: 'trainer') }
  let(:receptionist) { shop.staffs.create!(name: 'Le Tan', role: 'staff') }

  def create_pt_package(name:, price:, commission_type:, commission_rate:, sale_commission_rate:)
    shop.packages.create!(
      name: name, price: price, sessions_count: 10, pt_package: true,
      commission_type: commission_type, commission_rate: commission_rate, sale_commission_rate: sale_commission_rate
    )
  end

  def create_client(name:, phone:, package:, trainer:)
    CreateMembership.call(
      shop: shop, customer_name: name, phone: phone, package_id: package.id, assigned_staff_id: trainer.id
    )
  end

  def seed_november_pt_activity(flat_pkg, pct_pkg)
    client_a = create_client(name: 'Client A', phone: '0901000001', package: flat_pkg, trainer: trainer_kiet)
    client_b = create_client(name: 'Client B', phone: '0901000002', package: pct_pkg, trainer: trainer_lan)
    client_b.invoices.create!(amount: 4_000_000, status: 'paid')

    2.times { CheckInMembership.call(membership: client_a, staff: receptionist) }
    CheckInMembership.call(membership: client_b, staff: trainer_lan)
  end

  describe '.call' do
    it 'calculates flat and percentage session and sales commissions without double counting' do
      flat_pkg = create_pt_package(
        name: 'PT Boxing', price: 5_000_000, commission_type: 'flat', commission_rate: 150_000, sale_commission_rate: 10
      )
      pct_pkg = create_pt_package(
        name: 'PT Yoga', price: 4_000_000, commission_type: 'percent', commission_rate: 25, sale_commission_rate: 5
      )

      travel_to Time.zone.local(2026, 11, 15, 10, 0, 0) do
        seed_november_pt_activity(flat_pkg, pct_pkg)
        report = described_class.call(shop, '2026-11')

        expect(report[:summary]).to include(
          total_trainers: 2, total_sessions_completed: 3, total_session_commission: 400_000,
          total_sales_amount: 9_000_000, total_sale_commission: 700_000, total_commission: 1_100_000
        )

        row_kiet = report[:trainers].find { |r| r[:trainer_id] == trainer_kiet.id }
        expect(row_kiet).to include(sessions_completed: 2, session_commission: 300_000, total_commission: 800_000)

        row_lan = report[:trainers].find { |r| r[:trainer_id] == trainer_lan.id }
        expect(row_lan).to include(sessions_completed: 1, session_commission: 100_000, total_commission: 300_000)
      end
    end

    it 'filters by month and individual trainer_id' do
      flat_pkg = create_pt_package(
        name: 'PT Boxing', price: 5_000_000, commission_type: 'flat', commission_rate: 150_000, sale_commission_rate: 10
      )

      member = nil
      travel_to Time.zone.local(2026, 10, 10, 9, 0, 0) do
        member = CreateMembership.call(
          shop: shop, customer_name: 'Client Oct', phone: '0901000003',
          package_id: flat_pkg.id, assigned_staff_id: trainer_kiet.id
        )
        CheckInMembership.call(membership: member, staff: receptionist)
      end

      travel_to Time.zone.local(2026, 11, 10, 9, 0, 0) do
        CheckInMembership.call(membership: member, staff: receptionist)
      end

      oct_report = described_class.call(shop, '2026-10', trainer_id: trainer_kiet.id)
      expect(oct_report[:summary]).to include(total_sessions_completed: 1, total_sales_count: 1)

      nov_report = described_class.call(shop, '2026-11', trainer_id: trainer_kiet.id)
      expect(nov_report[:summary]).to include(total_sessions_completed: 1, total_sales_count: 0)
    end
  end
end
