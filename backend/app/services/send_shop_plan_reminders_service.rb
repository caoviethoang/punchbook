# frozen_string_literal: true

# Service to find shop plans expiring within 10 days and send Zalo/SMS reminders.
class SendShopPlanRemindersService
  def self.call
    new.call
  end

  def call
    expiring_shops.find_each do |shop|
      process_shop(shop)
    end
    @sent_count
  end

  private

  def expiring_shops
    Shop.where(plan: 'paid')
        .where('plan_expires_at IS NOT NULL AND plan_expires_at <= ? AND plan_expires_at > ?',
               10.days.from_now, Time.current)
  end

  def process_shop(shop)
    return if shop.phone.blank? || already_notified_today?(shop)

    send_reminder(shop)
    mark_notified_today(shop)
    @sent_count += 1
  end

  def initialize
    @sent_count = 0
  end

  def already_notified_today?(shop)
    cache_key = "shop_plan_reminder_sent:#{shop.id}:#{Time.zone.today}"
    Rails.cache.read(cache_key).present?
  end

  def mark_notified_today(shop)
    cache_key = "shop_plan_reminder_sent:#{shop.id}:#{Time.zone.today}"
    Rails.cache.write(cache_key, true, expires_in: 24.hours)
  end

  def send_reminder(shop)
    ZaloService.new.send_template_message(
      phone: shop.phone,
      template_id: ENV.fetch('ZALO_SHOP_PLAN_EXPIRING_TEMPLATE_ID', '300100'),
      template_data: build_template_data(shop)
    )
  rescue ZaloService::Error => e
    Rails.logger.error("[SendShopPlanRemindersService] Failed to send Zalo reminder to shop #{shop.id}: #{e.message}")
  end

  def build_template_data(shop)
    days_left = ((shop.plan_expires_at - Time.current) / 1.day).ceil
    expiry_date = shop.plan_expires_at.strftime('%d/%m/%Y')
    { 'shop_name' => shop.name, 'expiry_date' => expiry_date, 'days_left' => days_left.to_s, 'phone' => shop.phone }
  end
end
