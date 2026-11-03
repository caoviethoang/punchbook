# frozen_string_literal: true

class ClassScheduleSerializer
  SCHEDULE_FIELDS = %i[
    id starts_at ends_at max_capacity status credit_policy cancellation_hours series_id
  ].freeze

  BOOKING_FIELDS = %i[
    id membership_id status checked_in_at credit_deducted queued_at promoted_at promotion_notified_at
  ].freeze

  class << self
    def call(schedule, roster: false)
      bookings = schedule.class_bookings.to_a
      result = base_json(schedule).merge(
        'class_type' => schedule.class_type.as_json(only: %i[id name color description]),
        'instructor' => schedule.instructor&.as_json(only: %i[id name]),
        'booked_count' => count_booked(bookings),
        'waitlisted_count' => count_waitlisted(bookings)
      )
      result['bookings'] = serialize_roster(bookings) if roster
      result
    end

    def booking_json(booking)
      booking.as_json(only: BOOKING_FIELDS).merge(
        'customer_name' => booking.membership.customer_name,
        'phone' => booking.membership.phone
      )
    end

    private

    def base_json(schedule)
      schedule.as_json(only: SCHEDULE_FIELDS)
    end

    def count_booked(bookings)
      bookings.count { |item| %w[booked attended].include?(item.status) }
    end

    def count_waitlisted(bookings)
      bookings.count { |item| item.status == 'waitlisted' }
    end

    def serialize_roster(bookings)
      bookings.sort_by(&:queued_at).map { |booking| booking_json(booking) }
    end
  end
end
