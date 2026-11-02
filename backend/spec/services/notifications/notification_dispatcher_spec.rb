# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Notifications::NotificationDispatcher do
  let(:shop) do
    create_shop(
      zalo_notifications_enabled: true,
      sms_notifications_enabled: true,
      email_notifications_enabled: true
    )
  end
  let(:package) { Package.create!(shop: shop, name: 'Standard', sessions_count: 5, price: 100_000) }
  let(:membership) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'Nguyen Van A',
      phone: '0987654321',
      email: 'member@test.com'
    )
  end

  before do
    allow(Notifications::ZaloAdapter).to receive(:send_notification).and_return(
      { success: true, channel: 'zalo', recipient: '0987654321' }
    )
    allow(Notifications::SmsAdapter).to receive(:send_notification).and_return(
      { success: true, channel: 'sms', recipient: '0987654321' }
    )
    allow(Notifications::EmailAdapter).to receive(:send_notification).and_return(
      { success: true, channel: 'email', recipient: 'member@test.com' }
    )
  end

  describe '.dispatch' do
    it 'dispatches via Zalo and Email when both are enabled' do
      expect do
        described_class.dispatch(:welcome, shop: shop, membership: membership)
      end.to change(NotificationLog, :count).by(2)

      expect(Notifications::ZaloAdapter).to have_received(:send_notification)
      expect(Notifications::EmailAdapter).to have_received(:send_notification)
      expect(Notifications::SmsAdapter).not_to have_received(:send_notification)

      logs = NotificationLog.where(shop: shop)
      expect(logs.pluck(:channel)).to contain_exactly('zalo', 'email')
    end

    it 'falls back to SMS when Zalo fails' do
      allow(Notifications::ZaloAdapter).to receive(:send_notification).and_return(
        { success: false, channel: 'zalo', recipient: '0987654321', error: 'User blocked OA' }
      )

      expect do
        described_class.dispatch(:expiring_reminder, shop: shop, membership: membership)
      end.to change(NotificationLog, :count).by(3) # failed zalo + sent sms + sent email

      expect(Notifications::SmsAdapter).to have_received(:send_notification)

      failed_zalo = NotificationLog.find_by(channel: 'zalo', status: 'failed')
      expect(failed_zalo.error_message).to eq('User blocked OA')

      sent_sms = NotificationLog.find_by(channel: 'sms', status: 'sent')
      expect(sent_sms).to be_present
    end

    it 'uses SMS directly if Zalo is disabled in shop settings' do
      shop.update!(zalo_notifications_enabled: false, sms_notifications_enabled: true)

      described_class.dispatch(:welcome, shop: shop, membership: membership)

      expect(Notifications::ZaloAdapter).not_to have_received(:send_notification)
      expect(Notifications::SmsAdapter).to have_received(:send_notification)
    end

    it 'skips Email if email notifications are disabled' do
      shop.update!(email_notifications_enabled: false)

      described_class.dispatch(:welcome, shop: shop, membership: membership)

      expect(Notifications::EmailAdapter).not_to have_received(:send_notification)
      expect(NotificationLog.where(channel: 'email')).to be_empty
    end
  end
end
