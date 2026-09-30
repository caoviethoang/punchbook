# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SendShopPlanRemindersService do
  describe '.call' do
    let(:expiring_shop) do
      Shop.create!(
        name: 'Expiring Gym',
        email: 'expiring@example.com',
        password: 'password123',
        phone: '0901234567',
        plan: 'paid',
        plan_expires_at: 5.days.from_now
      )
    end

    let(:zalo_service) { instance_double(ZaloService) }
    let(:memory_store) { ActiveSupport::Cache::MemoryStore.new }

    before do
      allow(Rails).to receive(:cache).and_return(memory_store)
      allow(ZaloService).to receive(:new).and_return(zalo_service)
      allow(zalo_service).to receive(:send_template_message).and_return({ 'error' => 0 })
    end

    it 'sends Zalo reminder to shops expiring within 10 days' do
      expiring_shop
      described_class.call

      expect(zalo_service).to have_received(:send_template_message).once.with(
        phone: '0901234567',
        template_id: anything,
        template_data: hash_including('shop_name' => 'Expiring Gym')
      )
    end

    it 'does not send reminder twice on the same day' do
      expiring_shop
      described_class.call

      expect(zalo_service).to have_received(:send_template_message).once
      sent_count = described_class.call
      expect(sent_count).to eq(0)
    end
  end
end
