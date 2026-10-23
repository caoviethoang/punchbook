# frozen_string_literal: true

require 'rails_helper'

RSpec.describe BatchCheckInMemberships do
  let(:shop) { Shop.create!(name: 'Yoga Harmony', email: 'yoga@example.com', password: 'password123') }
  let(:staff) { Staff.create!(shop: shop, name: 'HLV Nam', role: 'staff') }
  let(:package) { Package.create!(shop: shop, name: 'Yoga 10 buổi', sessions_count: 10, price: 1_200_000) }

  def create_member(name, phone, sessions_left)
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: name,
      phone: phone,
      sessions_left: sessions_left
    )
  end

  it 'processes multiple eligible memberships successfully' do
    first_member = create_member('Học viên A', '0901000001', 10)
    second_member = create_member('Học viên B', '0901000002', 1)

    result = described_class.call(
      shop: shop,
      membership_ids: [first_member.id, second_member.id],
      staff: staff
    )

    expect(result[:total]).to eq(2)
    expect(result[:success_count]).to eq(2)
    expect(result[:failed_count]).to eq(0)
    expect(first_member.reload.sessions_left).to eq(9)
    expect(second_member.reload.sessions_left).to eq(0)
    expect(CheckIn.where(membership: [first_member, second_member]).count).to eq(2)
  end

  it 'handles partial success when some memberships fail or are exhausted' do
    first_member = create_member('Học viên A', '0901000001', 10)
    expired_member = create_member('Học viên Hết Buổi', '0901000003', 0)

    result = described_class.call(
      shop: shop,
      membership_ids: [first_member.id, expired_member.id, 'non-existent-uuid'],
      staff: staff
    )

    expect(result[:total]).to eq(3)
    expect(result[:success_count]).to eq(1)
    expect(result[:failed_count]).to eq(2)

    res_success = result[:results].find { |r| r[:membership_id] == first_member.id }
    expect(res_success[:status]).to eq('success')

    res_exhausted = result[:results].find { |r| r[:membership_id] == expired_member.id }
    expect(res_exhausted[:status]).to eq('failed')
    expect(res_exhausted[:error]).to include('hết số buổi')

    res_missing = result[:results].find { |r| r[:membership_id] == 'non-existent-uuid' }
    expect(res_missing[:status]).to eq('failed')
    expect(res_missing[:error]).to include('không tồn tại')
  end
end
