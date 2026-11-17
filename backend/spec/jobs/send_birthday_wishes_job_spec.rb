# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SendBirthdayWishesJob, type: :job do
  include ActiveJob::TestHelper

  let(:shop) { create_shop }
  let(:package) { Package.create!(shop: shop, name: 'Standard', sessions_count: 10, price: 500_000) }
  let(:today) { Time.zone.today }

  let!(:birthday_member) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'Nguyen Birthday',
      phone: '0901111222',
      email: 'birthday@example.com',
      date_of_birth: Date.new(1996, today.month, today.day)
    )
  end

  let!(:other_member) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'Tran Normal',
      phone: '0903333444',
      email: 'normal@example.com',
      date_of_birth: Date.new(1996, (today.month % 12) + 1, 1)
    )
  end

  before do
    clear_enqueued_jobs
  end

  it 'enqueues SendNotificationJob only for members having birthday today' do
    expect do
      described_class.new.perform(today)
    end.to have_enqueued_job(SendNotificationJob).with(
      :birthday_wish,
      shop_id: shop.id,
      membership_id: birthday_member.id
    ).once

    expect(other_member).to be_persisted
  end

  it 'is idempotent and does not enqueue duplicate greetings on the same day' do
    NotificationLog.create!(
      shop: shop,
      membership: birthday_member,
      channel: 'email',
      event_type: 'birthday_wish',
      recipient: birthday_member.email,
      status: 'sent'
    )

    expect do
      described_class.new.perform(today)
    end.not_to have_enqueued_job(SendNotificationJob)
  end
end
