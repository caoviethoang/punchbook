# frozen_string_literal: true

class UpdateClassSchedule
  def self.call(schedule:, attributes:, staff:)
    schedule.shop.with_lock do
      schedule.with_lock do
        new(schedule, attributes, staff).call
      end
    end
  end

  def initialize(schedule, attributes, staff)
    @schedule = schedule
    @attributes = attributes
    @bookings = ClassBookingService.new(schedule: schedule, staff: staff)
  end

  def call
    @schedule.assign_attributes(@attributes)
    validate_changes!
    @schedule.save!
    case @schedule.status
    when 'cancelled' then @bookings.cancel_class!
    when 'completed' then complete_roster!
    else @bookings.promote_waitlist!
    end
    @schedule
  end

  private

  def validate_changes!
    fail_with(:closed) if %w[cancelled completed].include?(@schedule.status_in_database)
    fail_with(:not_ended) if @schedule.status == 'completed' && @schedule.ends_at && @schedule.ends_at > Time.current
    protected_fields = %w[starts_at ends_at class_type_id credit_policy cancellation_hours]
    return unless protected_fields.intersect?(@schedule.changed) && @schedule.class_bookings.exists?

    fail_with(:has_bookings)
  end

  def complete_roster!
    @schedule.class_bookings.where(status: 'booked').find_each { |booking| booking.update!(status: 'no_show') }
    @schedule.class_bookings.where(status: 'waitlisted').find_each { |booking| booking.update!(status: 'cancelled') }
  end

  def fail_with(key)
    raise ClassBookingService::Error, I18n.t("classes.errors.#{key}")
  end
end
