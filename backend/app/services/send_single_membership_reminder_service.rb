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
    membership.with_lock do
      next unless Membership.needing_reminder.exists?(membership.id)
      next if membership.reminder_sent_today?

      deliver_reminder
    end
  rescue StandardError => e
    Rails.logger.error("Failed to send membership reminder for membership #{membership.id}: #{e.message}")
    raise
  end

  private

  attr_reader :membership

  def deliver_reminder
    payment_url = get_or_create_payment_link(membership)
    dispatch_reminder(membership, payment_url)
    membership.membership_reminders.create!(sent_at: Time.current, reminder_type: 'expiring')
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

  def dispatch_reminder(membership, payment_url)
    results = Notifications::NotificationDispatcher.dispatch(
      :expiring_reminder,
      shop: membership.shop,
      membership: membership,
      payment_url: payment_url
    )

    failed = results.find { |r| !r[:success] && !r[:skipped] && r[:error].present? }
    raise StandardError, failed[:error] if failed && results.none? { |r| r[:success] }
  end
end
