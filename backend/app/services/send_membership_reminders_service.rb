# frozen_string_literal: true

# Service to process and send reminders to members whose memberships are expiring.
# Ensures deduplication by skipping memberships that have already been reminded today.
class SendMembershipRemindersService
  def self.call
    new.call
  end

  def call
    expiring_memberships.each_with_object([]) do |membership, sent_reminders|
      next if membership.reminder_sent_today?

      reminder = process_reminder(membership)
      sent_reminders << reminder if reminder
    end
  end

  private

  def process_reminder(membership)
    payment_url = get_or_create_payment_link(membership)
    send_zalo_reminder(membership, payment_url)

    membership.membership_reminders.create!(sent_at: Time.current, reminder_type: 'expiring')
  rescue StandardError => e
    Rails.logger.error("Failed to send membership reminder for membership #{membership.id}: #{e.message}")
    nil
  end

  def expiring_memberships
    Membership.needing_reminder.includes(:package, :shop)
  end

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
    membership.invoices
              .where(status: 'pending')
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
