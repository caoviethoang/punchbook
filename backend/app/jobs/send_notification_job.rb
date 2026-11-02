# frozen_string_literal: true

class SendNotificationJob < ApplicationJob
  queue_as :default

  def perform(event_type, shop_id:, **options)
    shop = Shop.find_by(id: shop_id)
    return unless shop

    dispatch_event(event_type, shop, options)
  end

  private

  def dispatch_event(event_type, shop, options)
    Notifications::NotificationDispatcher.dispatch(
      event_type,
      shop: shop,
      membership: find_membership(options[:membership_id]),
      check_in: CheckIn.find_by(id: options[:check_in_id]),
      invoice: Invoice.find_by(id: options[:invoice_id]),
      payment_url: options[:payment_url]
    )
  end

  def find_membership(id)
    Membership.with_discarded.find_by(id: id) if id
  end
end
