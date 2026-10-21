# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CreateMembership do
  let(:shop) { Shop.create!(name: 'Lotus Spa', email: 'lotus@example.com', password: 'password123') }
  let(:package) { Package.create!(shop: shop, name: 'Gói 10 buổi', sessions_count: 10, price: 1_000_000) }

  it 'creates a membership with notes' do
    membership = described_class.call(
      shop: shop,
      customer_name: 'Nguyễn Văn A',
      phone: '0912345678',
      package_id: package.id,
      notes: 'Khách có tiền sử dị ứng tinh dầu quế'
    )

    expect(membership).to be_persisted
    expect(membership.customer_name).to eq('Nguyễn Văn A')
    expect(membership.phone).to eq('0912345678')
    expect(membership.notes).to eq('Khách có tiền sử dị ứng tinh dầu quế')
    expect(membership.sessions_left).to eq(10)
  end

  it 'creates a membership without notes by default' do
    membership = described_class.call(
      shop: shop,
      customer_name: 'Trần Thị B',
      phone: '0987654321',
      package_id: package.id
    )

    expect(membership).to be_persisted
    expect(membership.notes).to be_nil
  end
end
