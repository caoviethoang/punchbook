# frozen_string_literal: true

# Service to process and send reminders to members whose memberships are expiring.
# Ensures deduplication by skipping memberships that have already been reminded today.
# rubocop:disable Metrics/MethodLength
class SendMembershipRemindersService
  def self.call
    new.call
  end

  def call
    sent_reminders = []

    expiring_memberships.each do |membership|
      next if membership.reminder_sent_today?

      begin
        payment_url = get_or_create_payment_link(membership)
        send_zalo_reminder(membership, payment_url)

        reminder = membership.membership_reminders.create!(
          sent_at: Time.current,
          reminder_type: 'expiring'
        )
        sent_reminders << reminder
      rescue StandardError => e
        Rails.logger.error("Failed to send membership reminder for membership #{membership.id}: #{e.message}")
      end
    end

    sent_reminders
  end

  private

  def expiring_memberships
    Membership.needing_reminder.includes(:package, :shop)
  end

  def get_or_create_payment_link(membership)
    pending_invoice = membership.invoices
                                .where(status: 'pending')
                                .where.not(payos_checkout_url: nil)
                                .order(created_at: :desc)
                                .first

    if pending_invoice.present?
      pending_invoice.payos_checkout_url
    else
      invoice, _payos_result = CreateInvoice.call(
        shop: membership.shop,
        membership_id: membership.id,
        params: { amount: membership.package.price }
      )
      invoice.payos_checkout_url
    end
  end

  def send_zalo_reminder(membership, payment_url)
    zalo_service = ZaloService.new
    template_id = ENV.fetch('ZALO_TEMPLATE_ID_MEMBERSHIP_REMINDER', '')
    template_data = {
      'customer_name' => membership.customer_name,
      'shop_name' => membership.shop.name,
      'remaining_sessions' => membership.sessions_left.to_i.to_s,
      'expiry_date' => membership.expires_at&.strftime('%d/%m/%Y') || '',
      'payment_url' => payment_url
    }
    tracking_id = "pb_remind_#{membership.id}_#{Time.current.strftime('%Y%m%d')}"

    zalo_service.send_template_message(
      phone: membership.phone,
      template_id: template_id,
      template_data: template_data,
      tracking_id: tracking_id
    )
  end
end
# rubocop:enable Metrics/MethodLength
