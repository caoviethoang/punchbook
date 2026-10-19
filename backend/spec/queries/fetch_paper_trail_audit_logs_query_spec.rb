# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FetchPaperTrailAuditLogsQuery do
  let!(:shop) do
    Shop.create!(
      name: 'PaperTrail Audit Shop',
      email: 'pt_audit@test.com',
      password: 'password123',
      phone: '0901234567'
    )
  end

  let!(:staff) do
    shop.staffs.create!(
      name: 'Audit Staff',
      role: 'admin',
      username: 'audit_staff',
      password: 'password123'
    )
  end

  let!(:package) do
    Package.create!(shop: shop, name: 'Standard 10', price: 200_000, sessions_count: 10)
  end

  describe '.call' do
    it 'returns empty array when no PaperTrail versions exist' do
      expect(described_class.call(shop)).to eq([])
    end

    it 'returns PaperTrail versions for membership events' do
      PaperTrail.request(whodunnit: staff.name) do
        Membership.create!(
          shop: shop,
          package: package,
          customer_name: 'Jane Doe',
          phone: '0908888888',
          sessions_left: 10
        )
      end

      versions = described_class.call(shop)
      expect(versions.size).to eq(1)
      expect(versions.first[:action]).to eq('membership_created')
      expect(versions.first[:staff_name]).to eq('Audit Staff')
      expect(versions.first[:details][:customer_name]).to eq('Jane Doe')
    end

    it 'filters out PaperTrail versions when log_action does not match' do
      PaperTrail.request(whodunnit: staff.name) do
        Membership.create!(
          shop: shop,
          package: package,
          customer_name: 'Jane Doe',
          phone: '0908888888',
          sessions_left: 10
        )
      end

      versions = described_class.call(shop, { log_action: 'unknown_action' })
      expect(versions).to eq([])
    end
  end
end
