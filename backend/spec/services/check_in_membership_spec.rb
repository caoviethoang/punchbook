# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CheckInMembership do
  let(:shop) { Shop.create!(name: 'Spa Lan', phone: '0901000000') }
  let(:staff) { Staff.create!(shop: shop, name: 'Mai', role: 'staff') }

  describe 'gói theo buổi' do
    let(:package) do
      Package.create!(shop: shop, name: '10 buổi massage', sessions_count: 10, price: 1_000_000)
    end
    let(:membership) do
      Membership.create!(
        shop: shop,
        package: package,
        customer_name: 'Chị Hoa',
        phone: '0902000000',
        sessions_left: 3
      )
    end

    it 'check-in thành công khi còn buổi, trừ 1 sessions_left và tạo CheckIn' do
      check_in = described_class.call(membership: membership, staff: staff)

      expect(check_in).to be_a(CheckIn)
      expect(check_in.membership).to eq(membership)
      expect(check_in.staff).to eq(staff)
      expect(check_in.checked_in_at).to be_within(2.seconds).of(Time.current)
      expect(membership.reload.sessions_left).to eq(2)
    end

    it 'check-in thất bại khi hết buổi, không trừ âm và không tạo CheckIn' do
      membership.update!(sessions_left: 0)

      expect {
        described_class.call(membership: membership, staff: staff)
      }.to raise_error(CheckInMembership::InsufficientSessionsError, 'Hội viên đã hết buổi')

      expect(membership.reload.sessions_left).to eq(0)
      expect(CheckIn.count).to eq(0)
    end

    it 'không cho sessions_left âm khi đã hết buổi' do
      membership.update!(sessions_left: 0)

      expect {
        described_class.call(membership: membership, staff: staff)
      }.to raise_error(CheckInMembership::InsufficientSessionsError)

      expect(membership.reload.sessions_left).to be >= 0
    end
  end

  describe 'gói theo ngày' do
    let(:package) do
      Package.create!(shop: shop, name: 'Tháng gym', sessions_count: nil, price: 500_000)
    end
    let(:membership) do
      Membership.create!(
        shop: shop,
        package: package,
        customer_name: 'Anh Tuấn',
        phone: '0903000000',
        sessions_left: nil,
        expires_at: Date.current + 10.days
      )
    end

    it 'check-in thành công khi còn hạn và không thay đổi sessions_left' do
      check_in = described_class.call(membership: membership, staff: staff)

      expect(check_in).to be_a(CheckIn)
      expect(check_in.membership).to eq(membership)
      expect(membership.reload.sessions_left).to be_nil
      expect(membership.expires_at).to eq(Date.current + 10.days)
    end

    it 'check-in thành công đúng ngày hết hạn (expires_at = hôm nay)' do
      membership.update!(expires_at: Date.current)

      expect {
        described_class.call(membership: membership, staff: staff)
      }.to change(CheckIn, :count).by(1)
    end

    it 'check-in thất bại khi hết hạn, không tạo CheckIn' do
      membership.update!(expires_at: Date.current - 1.day)

      expect {
        described_class.call(membership: membership, staff: staff)
      }.to raise_error(CheckInMembership::MembershipExpiredError, 'Hội viên đã hết hạn')

      expect(CheckIn.count).to eq(0)
      expect(membership.reload.sessions_left).to be_nil
    end

    it 'check-in thất bại khi không có expires_at' do
      membership.update!(expires_at: nil)

      expect {
        described_class.call(membership: membership, staff: staff)
      }.to raise_error(CheckInMembership::MembershipExpiredError)
    end
  end

  describe 'check-in đồng thời' do
    # Transactional fixtures ẩn data với thread khác — tắt để test race condition thật
    self.use_transactional_tests = false

    let!(:shop) { Shop.create!(name: 'Gym Race', phone: '0904000000') }
    let!(:staff) { Staff.create!(shop: shop, name: 'Lan', role: 'staff') }
    let!(:package) do
      Package.create!(shop: shop, name: '5 buổi', sessions_count: 5, price: 500_000)
    end
    let!(:membership) do
      Membership.create!(
        shop: shop,
        package: package,
        customer_name: 'Khách Race',
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

    it '2 request cùng lúc chỉ trừ đúng 1 buổi, không trừ âm' do
      membership_id = membership.id
      results = []
      errors = []
      mutex = Mutex.new

      threads = 2.times.map do
        Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            m = Membership.find(membership_id)
            s = Staff.find(staff.id)
            begin
              check_in = described_class.call(membership: m, staff: s)
              mutex.synchronize { results << check_in }
            rescue CheckInMembership::InsufficientSessionsError => e
              mutex.synchronize { errors << e }
            end
          end
        end
      end

      threads.each(&:join)

      expect(results.size).to eq(1)
      expect(errors.size).to eq(1)
      expect(membership.reload.sessions_left).to eq(0)
      expect(CheckIn.where(membership_id: membership_id).count).to eq(1)
    end
  end
end
