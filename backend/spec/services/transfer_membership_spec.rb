# frozen_string_literal: true

require 'rails_helper'

RSpec.describe TransferMembership do
  let(:shop) { create_shop(name: 'Iron Gym') }
  let(:staff) { Staff.create!(shop: shop, name: 'Coach Minh', role: 'staff') }
  let(:session_pkg) { Package.create!(shop: shop, name: '10 Sessions', sessions_count: 10, price: 1_000_000) }
  let(:day_pkg) { Package.create!(shop: shop, name: 'Monthly Pass', duration_days: 30, price: 600_000) }

  describe '.call' do
    context 'with session-based package to a new customer' do
      let(:source) do
        Membership.create!(
          shop: shop,
          package: session_pkg,
          customer_name: 'Nguyen Van A',
          phone: '0901234567',
          sessions_left: 6
        )
      end

      it 'updates source membership attributes correctly' do
        result = described_class.call(
          source_membership: source,
          target_customer_name: 'Tran Thi B',
          target_phone: '0987654321',
          staff: staff,
          transfer_fee: 50_000,
          note: 'Chuyen nhuong ban be'
        )

        source.reload
        expect(source.sessions_left).to eq(0)
        expect(source.status).to eq('transferred')
        expect(source.transferred?).to be true
        expect(source.transferred_to_membership_id).to eq(result[:target_membership].id)
      end

      it 'creates target membership and transfer record with invoice' do
        result = described_class.call(
          source_membership: source,
          target_customer_name: 'Tran Thi B',
          target_phone: '0987654321',
          staff: staff,
          transfer_fee: 50_000,
          note: 'Chuyen nhuong ban be'
        )

        target = result[:target_membership]
        transfer = result[:transfer]
        invoice = result[:invoice]

        expect(target.customer_name).to eq('Tran Thi B')
        expect(target.sessions_left).to eq(6)
        expect(target.status).to eq('active')
        expect(transfer.fee).to eq(50_000)
        expect(invoice.amount).to eq(50_000)
      end

      it 'creates an audit log entry for the transfer' do
        expect do
          described_class.call(
            source_membership: source,
            target_customer_name: 'Tran Thi B',
            target_phone: '0987654321',
            staff: staff
          )
        end.to change(AuditLog, :count).by(1)

        log = AuditLog.where(action: 'membership_transferred').last
        expect(log).to be_present
        expect(log.staff).to eq(staff)
        expect(log.details['source_customer_name']).to eq('Nguyen Van A')
      end
    end

    context 'with day-based package to an existing customer' do
      it 'extends remaining days on existing membership and marks source as transferred' do
        source = Membership.create!(
          shop: shop, package: day_pkg, customer_name: 'Le Van C',
          phone: '0912345678', expires_at: Date.current + 15.days
        )
        existing = Membership.create!(
          shop: shop, package: day_pkg, customer_name: 'Pham Thi D',
          phone: '0933333333', expires_at: Date.current + 10.days
        )

        result = described_class.call(
          source_membership: source,
          target_customer_name: 'Pham Thi D',
          target_phone: '0933333333',
          staff: staff
        )

        expect(source.reload.status).to eq('transferred')
        expect(source.expires_at).to eq(Date.current)
        expect(result[:target_membership].id).to eq(existing.id)
        expect(result[:target_membership].expires_at).to eq(Date.current + 25.days)
      end
    end

    context 'with invalid parameters or ineligible status' do
      it 'raises error when source membership has no sessions left' do
        source = Membership.create!(
          shop: shop,
          package: session_pkg,
          customer_name: 'Zero Sessions',
          phone: '0900000001',
          sessions_left: 0
        )

        expect do
          described_class.call(
            source_membership: source,
            target_customer_name: 'New User',
            target_phone: '0900000002'
          )
        end.to raise_error(TransferMembership::IneligibleMembershipError)
      end

      it 'raises error when source membership has expired' do
        source = Membership.create!(
          shop: shop,
          package: day_pkg,
          customer_name: 'Expired User',
          phone: '0900000003',
          expires_at: 1.day.ago.to_date
        )

        expect do
          described_class.call(
            source_membership: source,
            target_customer_name: 'New User',
            target_phone: '0900000004'
          )
        end.to raise_error(TransferMembership::IneligibleMembershipError)
      end

      it 'raises error when trying to transfer to self (same phone)' do
        source = Membership.create!(
          shop: shop,
          package: session_pkg,
          customer_name: 'Same Phone',
          phone: '0901112222',
          sessions_left: 5
        )

        expect do
          described_class.call(
            source_membership: source,
            target_customer_name: 'Another Name',
            target_phone: '090-111-2222'
          )
        end.to raise_error(TransferMembership::InvalidTargetError)
      end

      it 'raises error when target name or phone is blank' do
        source = Membership.create!(
          shop: shop,
          package: session_pkg,
          customer_name: 'Valid Source',
          phone: '0903334444',
          sessions_left: 5
        )

        expect do
          described_class.call(
            source_membership: source,
            target_customer_name: '',
            target_phone: '0905556666'
          )
        end.to raise_error(TransferMembership::InvalidTargetError)

        expect do
          described_class.call(
            source_membership: source,
            target_customer_name: 'Valid Name',
            target_phone: ''
          )
        end.to raise_error(TransferMembership::InvalidTargetError)
      end
    end
  end
end
