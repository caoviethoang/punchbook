# frozen_string_literal: true

class ClassBookingPromotionJob < ApplicationJob
  queue_as :default
  retry_on StandardError, wait: :polynomially_longer, attempts: 5

  def perform(booking_id, promoted_at)
    booking = ClassBooking.includes(:membership, class_schedule: %i[shop class_type]).find_by(id: booking_id)
    return unless booking

    booking.with_lock do
      next unless booking.status == 'booked' && booking.promoted_at&.iso8601(6) == promoted_at
      next if booking.promotion_notified_at || booking.class_schedule.starts_at <= Time.current

      notify_member(booking)
      booking.update!(promotion_notified_at: Time.current)
    end
  end

  private

  def notify_member(booking)
    schedule = booking.class_schedule
    ZaloService.new.send_template_message(
      phone: booking.membership.phone,
      template_id: ENV.fetch('ZALO_TEMPLATE_ID_CLASS_PROMOTION', ''),
      template_data: promotion_template_data(booking, schedule),
      tracking_id: "class_#{booking.id}_#{booking.promoted_at.to_i}"
    )
  end

  def promotion_template_data(booking, schedule)
    time_str = schedule.starts_at.in_time_zone('Asia/Ho_Chi_Minh').strftime('%d/%m/%Y %H:%M')
    {
      'customer_name' => booking.membership.customer_name,
      'shop_name' => schedule.shop.name,
      'class_name' => schedule.class_type.name,
      'starts_at' => time_str
    }
  end
end
