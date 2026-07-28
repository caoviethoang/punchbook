# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CheckInMembership do
  let(:shop) { create_shop(name: 'Lan Spa', phone: '0901000000') }
  let(:staff) { Staff.create!(shop: shop, name: 'Mai', role: 'staff') }

  describe 'session-based package' do
    let(:package) do
      Package.create!(shop: shop, name: '10-session massage', sessions_count: 10, price: 1_000_000)
    end
    let(:membership) do
      Membership.create!(
        shop: shop,
        package: package,
        customer_name: 'Hoa Nguyen',
        phone: '0902000000',
        sessions_left: 3
      )
    end

    it 'checks in successfully when sessions remain, decrements sessions_left, and creates a CheckIn' do
      check_in = described_class.call(membership: membership, staff: staff)

      expect(check_in).to have_attributes(membership:, staff:)
      expect(check_in.checked_in_at).to be_within(2.seconds).of(Time.current)
      expect(membership.reload.sessions_left).to eq(2)
    end

    it 'fails when out of sessions, does not go negative, and does not create a CheckIn' do
      membership.update!(sessions_left: 0)

      expect { described_class.call(membership: membership, staff: staff) }
        .to raise_error(CheckInMembership::InsufficientSessionsError, 'Membership has no sessions left')

      expect(membership.reload.sessions_left).to eq(0)
      expect(CheckIn.count).to eq(0)
    end

    it 'does not allow sessions_left to go negative when already depleted' do
      membership.update!(sessions_left: 0)

      expect { described_class.call(membership: membership, staff: staff) }
        .to raise_error(CheckInMembership::InsufficientSessionsError)

      expect(membership.reload.sessions_left).to be >= 0
    end
  end

  describe 'day-based package' do
    let(:package) do
      Package.create!(shop: shop, name: 'Monthly gym', duration_days: 30, price: 500_000)
    end
    let(:membership) do
      Membership.create!(
        shop: shop,
        package: package,
        customer_name: 'Tuan Pham',
        phone: '0903000000',
        sessions_left: nil,
        expires_at: Date.current + 10.days
      )
    end

    it 'checks in successfully when still valid and does not change sessions_left' do
      check_in = described_class.call(membership: membership, staff: staff)

      expect(check_in).to have_attributes(membership:)
      expect(membership.reload).to have_attributes(sessions_left: nil, expires_at: Date.current + 10.days)
    end

    it 'checks in successfully on the expiry date (expires_at = today)' do
      membership.update!(expires_at: Date.current)

      expect { described_class.call(membership: membership, staff: staff) }
        .to change(CheckIn, :count).by(1)
    end

    it 'fails when expired and does not create a CheckIn' do
      membership.update!(expires_at: Date.current - 1.day)

      expect { described_class.call(membership: membership, staff: staff) }
        .to raise_error(CheckInMembership::MembershipExpiredError, 'Membership has expired')

      expect(CheckIn.count).to eq(0)
      expect(membership.reload.sessions_left).to be_nil
    end

    it 'fails when expires_at is missing' do
      membership.update!(expires_at: nil)

      expect { described_class.call(membership: membership, staff: staff) }
        .to raise_error(CheckInMembership::MembershipExpiredError)
    end
  end

  describe 'concurrent check-in' do
    # Transactional fixtures hide data from other threads — disable for a real race test
    self.use_transactional_tests = false

    let!(:shop) { create_shop(name: 'Race Gym', phone: '0904000000') }
    let!(:staff) { Staff.create!(shop: shop, name: 'Lan', role: 'staff') }
    let!(:package) do
      Package.create!(shop: shop, name: '5 sessions', sessions_count: 5, price: 500_000)
    end
    let!(:membership) do
      Membership.create!(
        shop: shop,
        package: package,
        customer_name: 'Race Customer',
        phone: '0905000000',
        sessions_left: 1
      )
    end

    after do
      CheckIn.delete_all
      Membership.delete_all
      Package.delete_all
      Staff.delete_all
      Shop.delete_all
    end

    it 'allows only one of two concurrent requests to consume the last session' do
      results, errors = run_concurrent_check_ins(membership_id: membership.id, staff_id: staff.id)

      expect(results.size).to eq(1)
      expect(errors.size).to eq(1)
      expect(membership.reload.sessions_left).to eq(0)
      expect(CheckIn.where(membership_id: membership.id).count).to eq(1)
    end
  end

  def run_concurrent_check_ins(membership_id:, staff_id:)
    results = []
    errors = []
    mutex = Mutex.new

    threads = Array.new(2) do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          attempt_check_in(membership_id, staff_id, results, errors, mutex)
        end
      end
    end
    threads.each(&:join)

    [results, errors]
  end

  def attempt_check_in(membership_id, staff_id, results, errors, mutex)
    check_in = described_class.call(
      membership: Membership.find(membership_id),
      staff: Staff.find(staff_id)
    )
    mutex.synchronize { results << check_in }
  rescue CheckInMembership::InsufficientSessionsError => e
    mutex.synchronize { errors << e }
  end
end
