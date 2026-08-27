# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SendMembershipRemindersJob, type: :job do
  include ActiveSupport::Testing::TimeHelpers

  let(:shop) { create_shop(plan: 'paid') }

  describe '#perform' do
    let!(:memberships) { setup_memberships(shop) }

    it 'sends reminders for expiring memberships on the first run for paid shops' do
      expect { described_class.new.perform }
        .to change(MembershipReminder, :count).by(2)

      expect(memberships[:expiring_session].reload).to be_reminder_sent_today
      expect(memberships[:expiring_day].reload).to be_reminder_sent_today
      expect(memberships[:active].reload).not_to be_reminder_sent_today
      expect(memberships[:expired].reload).not_to be_reminder_sent_today
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
