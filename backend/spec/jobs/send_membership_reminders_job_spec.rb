# frozen_string_literal: true

require 'rails_helper'

# rubocop:disable RSpec/MessageSpies
RSpec.describe SendMembershipRemindersJob, type: :job do
  include ActiveSupport::Testing::TimeHelpers

  let(:shop) { create_shop(plan: 'paid') }
  let(:payos_result) do
    PayosService::Result.new(
      payment_link_id: 'payos_link_123',
      checkout_url: 'https://pay.payos.vn/web/checkout_123',
      qr_code: 'qr_code_data'
    )
  end

  before do
    allow(PayosService).to receive(:create_payment_link).and_return(payos_result)

    # Stub Zalo OAuth Token Refresh
    stub_request(:post, 'https://oauth.zaloapp.com/v4/oa/access_token')
      .to_return(
        status: 200,
        body: { access_token: 'mock_access_token', refresh_token: 'mock_refresh_token', expires_in: 90_000 }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )

    # Stub Zalo Send Template Message
    stub_request(:post, 'https://business.openapi.zalo.me/message/template')
      .to_return(
        status: 200,
        body: { error: 0, message: 'Success', data: { msg_id: 'mock_msg_id' } }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )

    # Mock memory cache store
    allow(Rails).to receive(:cache).and_return(ActiveSupport::Cache.lookup_store(:memory_store))
    Rails.cache.clear
    Rails.cache.write('zalo_access_token', 'mock_access_token')
    Rails.cache.write('zalo_refresh_token', 'mock_refresh_token')

    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with('ZALO_REFRESH_TOKEN', nil).and_return('mock_refresh_token')
    allow(ENV).to receive(:fetch).with('ZALO_TEMPLATE_ID_MEMBERSHIP_REMINDER', '').and_return('mock_template_id')
  end

  describe '#perform' do
    let!(:memberships) { setup_memberships(shop) }

    it 'sends reminders for expiring memberships on the first run for paid shops' do
      expect { described_class.new.perform }
        .to change(MembershipReminder, :count).by(2)

      expect(memberships[:expiring_session].reload).to be_reminder_sent_today
      expect(memberships[:expiring_day].reload).to be_reminder_sent_today
      expect(memberships[:active].reload).not_to be_reminder_sent_today
      expect(memberships[:expired].reload).not_to be_reminder_sent_today

      expect(WebMock).to have_requested(:post, 'https://business.openapi.zalo.me/message/template').twice
    end

    it 'ignores memberships from free shops even if expiring' do
      free_shop = create_shop(plan: 'free')
      setup_memberships(free_shop)

      expect { described_class.new.perform }
        .to change(MembershipReminder, :count).by(2) # Only the paid shop memberships
    end

    it 'deduplicates reminders when run multiple times on the same day' do
      described_class.new.perform
      expect(MembershipReminder.count).to eq(2)

      expect { described_class.new.perform }
        .not_to change(MembershipReminder, :count)
    end

    it 'sends a new reminder if run on a subsequent day' do
      described_class.new.perform
      expect(MembershipReminder.count).to eq(2)

      travel_to 1.day.from_now do
        expect { described_class.new.perform }
          .to change(MembershipReminder, :count).by(2)
      end
    end

    it 'reuses an existing pending invoice and does not create a new one' do
      membership = memberships[:expiring_session]
      # Pre-create a pending invoice with checkout url
      Invoice.create!(membership: membership, amount: 100_000, status: 'pending', payos_checkout_url: 'https://pay.payos.vn/web/existing_checkout')

      expect(CreateInvoice).not_to receive(:call).with(hash_including(membership_id: membership.id))
      allow(CreateInvoice).to receive(:call).and_call_original

      described_class.new.perform

      expect(WebMock).to(have_requested(:post, 'https://business.openapi.zalo.me/message/template')
        .with do |req|
          body = JSON.parse(req.body)
          body['phone'] == '84901111111' && body['template_data']['payment_url'] == 'https://pay.payos.vn/web/existing_checkout'
        end)
    end

    it 'creates a new invoice if no pending invoice exists' do
      membership = memberships[:expiring_session]
      expect(CreateInvoice).to receive(:call).with(hash_including(membership_id: membership.id)).and_call_original
      allow(CreateInvoice).to receive(:call).with(hash_excluding(membership_id: membership.id)).and_call_original

      described_class.new.perform
    end
  end

  def setup_memberships(shop)
    session_pkg = Package.create!(shop: shop, name: '10-session', sessions_count: 10, price: 100_000)
    day_pkg = Package.create!(shop: shop, name: '30-day', duration_days: 30, price: 200_000)

    {
      expiring_session: Membership.create!(
        shop: shop, package: session_pkg, customer_name: 'Expiring Session', phone: '0901111111', sessions_left: 2
      ),
      expiring_day: Membership.create!(
        shop: shop, package: day_pkg, customer_name: 'Expiring Day', phone: '0902222222', expires_at: Date.current + 3
      ),
      active: Membership.create!(
        shop: shop, package: session_pkg, customer_name: 'Active', phone: '0903333333', sessions_left: 8
      ),
      expired: Membership.create!(
        shop: shop, package: session_pkg, customer_name: 'Expired', phone: '0904444444', sessions_left: 0
      )
    }
  end
end
# rubocop:enable RSpec/MessageSpies
