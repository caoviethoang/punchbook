# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SendMembershipRemindersJob, type: :job do
  include ActiveSupport::Testing::TimeHelpers
  include ActiveJob::TestHelper

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

    stub_request(:post, 'https://oauth.zaloapp.com/v4/oa/access_token')
      .to_return(
        status: 200,
        body: { access_token: 'mock_access_token', refresh_token: 'mock_refresh_token', expires_in: 90_000 }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )

    stub_request(:post, 'https://business.openapi.zalo.me/message/template')
      .to_return(
        status: 200,
        body: { error: 0, message: 'Success', data: { msg_id: 'mock_msg_id' } }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )

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

    it 'enqueues SendSingleMembershipReminderJob for expiring memberships in paid shops' do
      expect { described_class.new.perform }
        .to have_enqueued_job(SendSingleMembershipReminderJob).with(memberships[:expiring_session].id)
        .and have_enqueued_job(SendSingleMembershipReminderJob).with(memberships[:expiring_day].id)
    end

    it 'executes enqueued jobs and creates reminders on first run' do
      expect { perform_enqueued_jobs { described_class.new.perform } }
        .to change(MembershipReminder, :count).by(2)

      expect(memberships[:expiring_session].reload).to be_reminder_sent_today
      expect(memberships[:expiring_day].reload).to be_reminder_sent_today
      expect(memberships[:active].reload).not_to be_reminder_sent_today
      expect(memberships[:expired].reload).not_to be_reminder_sent_today

      expect(WebMock).to have_requested(:post, 'https://business.openapi.zalo.me/message/template').twice
    end

    it 'ignores memberships from free shops' do
      free_shop = create_shop(plan: 'free')
      setup_memberships(free_shop)

      expect { perform_enqueued_jobs { described_class.new.perform } }
        .to change(MembershipReminder, :count).by(2)
    end

    it 'deduplicates reminders when run multiple times on the same day' do
      perform_enqueued_jobs { described_class.new.perform }
      expect(MembershipReminder.count).to eq(2)

      expect { perform_enqueued_jobs { described_class.new.perform } }
        .not_to change(MembershipReminder, :count)
    end

    it 'sends a new reminder if run on a subsequent day' do
      perform_enqueued_jobs { described_class.new.perform }
      expect(MembershipReminder.count).to eq(2)

      travel_to 1.day.from_now do
        expect { perform_enqueued_jobs { described_class.new.perform } }
          .to change(MembershipReminder, :count).by(2)
      end
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
