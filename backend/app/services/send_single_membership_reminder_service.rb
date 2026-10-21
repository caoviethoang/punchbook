# frozen_string_literal: true

# Service to process and send a single membership reminder.
# Ensures idempotency by checking reminder_sent_today?.
class SendSingleMembershipReminderService
  def self.call(membership)
    new(membership).call
  end

  def initialize(membership)
    @membership = membership
  end

  def call
    return nil if membership.reminder_sent_today?

    payment_url = get_or_create_payment_link(membership)
    send_zalo_reminder(membership, payment_url)

    membership.membership_reminders.create!(sent_at: Time.current, reminder_type: 'expiring')
  rescue StandardError => e
    Rails.logger.error("Failed to send membership reminder for membership #{membership.id}: #{e.message}")
    raise
  end

  private

  attr_reader :membership

  def get_or_create_payment_link(membership)
    url = find_pending_payment_url(membership)
    return url if url.present?

    invoice, = CreateInvoice.call(
      shop: membership.shop,
      membership_id: membership.id,
      params: { amount: membership.package.price }
    )
    invoice.payos_checkout_url
  end

  def find_pending_payment_url(membership)
    if membership.invoices.loaded?
      find_pending_url_from_loaded(membership.invoices)
    else
      find_pending_url_from_db(membership.invoices)
    end
  end

  def find_pending_url_from_loaded(invoices)
    invoices.select { |inv| inv.status == 'pending' && inv.payos_checkout_url.present? }
            .max_by(&:created_at)
            &.payos_checkout_url
  end

  def find_pending_url_from_db(invoices)
    invoices.where(status: 'pending')
            .where.not(payos_checkout_url: nil)
            .order(created_at: :desc)
            .first
            &.payos_checkout_url
  end

  def send_zalo_reminder(membership, payment_url)
    data = build_template_data(membership, payment_url)
    tracking_id = "pb_remind_#{membership.id}_#{Time.current.strftime('%Y%m%d')}"

    ZaloService.new.send_template_message(
      phone: membership.phone,
      template_id: ENV.fetch('ZALO_TEMPLATE_ID_MEMBERSHIP_REMINDER', ''),
      template_data: data,
      tracking_id: tracking_id
    )
  end

  def build_template_data(membership, payment_url)
    {
      'customer_name' => membership.customer_name,
      'shop_name' => membership.shop.name,
      'remaining_sessions' => membership.sessions_left.to_i.to_s,
      'expiry_date' => membership.expires_at&.strftime('%d/%m/%Y') || '',
      'payment_url' => payment_url
    }
  end
end
