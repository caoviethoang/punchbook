# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ExpiringMembershipsQuery do
  let(:shop) { create_shop }
  let(:session_pkg) { Package.create!(shop: shop, name: '10 sessions', sessions_count: 10, price: 200_000) }
  let(:day_pkg) { Package.create!(shop: shop, name: '30 days', duration_days: 30, price: 300_000) }

  def create_member(package:, customer_name:, sessions_left: nil, expires_at: nil)
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: customer_name,
      phone: '0901234567',
      sessions_left: sessions_left,
      expires_at: expires_at
    )
  end

  describe '.call' do
    it 'returns memberships with <= 3 sessions left' do
      m1 = create_member(package: session_pkg, customer_name: '1 left', sessions_left: 1)
      m2 = create_member(package: session_pkg, customer_name: '3 left', sessions_left: 3)
      m3 = create_member(package: session_pkg, customer_name: '4 left', sessions_left: 4)
      m_expired = create_member(package: session_pkg, customer_name: '0 left', sessions_left: 0)

      result = described_class.call

      expect(result).to include(m1, m2)
      expect(result).not_to include(m3, m_expired)
    end

    it 'returns memberships expiring within 3 days' do
      m_today = create_member(package: day_pkg, customer_name: 'Today', expires_at: Date.current)
      m_3_days = create_member(package: day_pkg, customer_name: '3 days', expires_at: Date.current + 3.days)
      m_4_days = create_member(package: day_pkg, customer_name: '4 days', expires_at: Date.current + 4.days)
      m_past = create_member(package: day_pkg, customer_name: 'Past', expires_at: Date.current - 1.day)

      result = described_class.call

      expect(result).to include(m_today, m_3_days)
      expect(result).not_to include(m_4_days, m_past)
    end
  end
end
