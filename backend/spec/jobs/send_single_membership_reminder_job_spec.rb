# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SendSingleMembershipReminderJob, type: :job do
  include ActiveSupport::Testing::TimeHelpers

  let(:shop) { create_shop(plan: 'paid') }
  let(:package) { Package.create!(shop: shop, name: '10-session', sessions_count: 10, price: 100_000) }
  let(:membership) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'Expiring Member',
      phone: '0901111111',
      sessions_left: 2
    )
  end

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
        body: { access_token: 'mock_token', refresh_token: 'mock_refresh', expires_in: 90_000 }.to_json,
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
    Rails.cache.write('zalo_access_token', 'mock_token')

    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with('ZALO_TEMPLATE_ID_MEMBERSHIP_REMINDER', '').and_return('mock_template_id')
  end

  describe '#perform' do
    it 'sends reminder and records membership_reminder' do
      expect { described_class.new.perform(membership.id) }
        .to change(MembershipReminder, :count).by(1)

      expect(membership.reload).to be_reminder_sent_today
      expect(WebMock).to have_requested(:post, 'https://business.openapi.zalo.me/message/template').once
    end

    it 'is idempotent and skips if reminder was already sent today' do
      described_class.new.perform(membership.id)
      expect(membership.reload).to be_reminder_sent_today

      expect { described_class.new.perform(membership.id) }
        .not_to change(MembershipReminder, :count)
    end

    it 'safely does nothing if membership_id is not found' do
      expect { described_class.new.perform('non-existent-uuid') }
        .not_to change(MembershipReminder, :count)
    end

    it 'reuses existing pending invoice checkout url' do
      Invoice.create!(
        membership: membership,
        amount: 100_000,
        status: 'pending',
        payos_checkout_url: 'https://pay.payos.vn/web/existing_checkout'
      )

      allow(CreateInvoice).to receive(:call)

      described_class.new.perform(membership.id)

      expect(CreateInvoice).not_to have_received(:call)

      expect(WebMock).to(have_requested(:post, 'https://business.openapi.zalo.me/message/template')
        .with do |req|
          body = JSON.parse(req.body)
          body['template_data']['payment_url'] == 'https://pay.payos.vn/web/existing_checkout'
        end)
    end
  end
end
