# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PaidShopMembershipsNeedingReminderQuery, type: :query do
  let(:paid_shop) { create_shop(plan: 'paid') }
  let(:free_shop) { create_shop(plan: 'free') }

  describe '.call' do
    let!(:data) { setup_query_test_data(paid_shop, free_shop) }

    it 'returns only paid-shop memberships needing reminder' do
      results = described_class.call

      expect(results).to include(data[:paid_expiring_session], data[:paid_expiring_day])
      expect(results).not_to include(data[:paid_active], data[:free_expiring_session], data[:free_expiring_day])
    end

    it 'is accessible via Membership.needing_reminder scope' do
      expect(Membership.needing_reminder).to contain_exactly(
        data[:paid_expiring_session],
        data[:paid_expiring_day]
      )
    end
  end

  def setup_query_test_data(paid_shop, free_shop)
    session_paid = Package.create!(shop: paid_shop, name: 'Session Pkg', sessions_count: 10, price: 100_000)
    day_paid = Package.create!(shop: paid_shop, name: 'Day Pkg', duration_days: 30, price: 200_000)

    session_free = Package.create!(shop: free_shop, name: 'Free Session Pkg', sessions_count: 10, price: 100_000)
    day_free = Package.create!(shop: free_shop, name: 'Free Day Pkg', duration_days: 30, price: 200_000)

    {
      paid_expiring_session: create_membership(paid_shop, session_paid, 'P Exp Session', '0901', sessions_left: 2),
      paid_expiring_day: create_membership(paid_shop, day_paid, 'P Exp Day', '0902', expires_at: Date.current + 5),
      paid_active: create_membership(paid_shop, session_paid, 'P Active', '0903', sessions_left: 8),
      free_expiring_session: create_membership(free_shop, session_free, 'F Exp Session', '0904', sessions_left: 2),
      free_expiring_day: create_membership(free_shop, day_free, 'F Exp Day', '0905', expires_at: Date.current + 3)
    }
  end

  def create_membership(shop, package, name, phone, **opts)
    Membership.create!({ shop: shop, package: package, customer_name: name, phone: phone }.merge(opts))
  end
end
