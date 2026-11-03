# frozen_string_literal: true

# All capacity changes lock the schedule before the membership to serialize booking and promotion.
class ClassBookingService
  class Error < StandardError; end

  def initialize(schedule:, staff:)
    @schedule = schedule
    @staff = staff
  end

  def book(membership)
    schedule.with_lock do
      ensure_open!
      membership.with_lock { create_or_update_booking(membership) }
    end
  end

  def cancel(membership)
    schedule.with_lock do
      booking = schedule.class_bookings.find_by!(membership: membership)
      return booking if booking.status == 'cancelled'

      execute_cancellation(booking)
    end
  end

  def check_in(membership)
    schedule.with_lock do
      booking = schedule.class_bookings.find_by!(membership: membership)
      return booking if booking.status == 'attended'

      validate_check_in!(booking)
      membership.with_lock { ClassAttendanceRecorder.call(booking: booking, schedule: schedule, staff: staff) }
      booking
    end
  end

  # Caller holds the schedule lock when changing capacity or cancelling a class.
  def promote_waitlist!
    return unless %w[scheduled ongoing].include?(schedule.status) && schedule.starts_at > Time.current

    schedule.class_bookings.where(status: 'waitlisted').order(:queued_at, :id).each do |booking|
      break unless available?

      promote!(booking)
    end
  end

  def cancel_class!
    schedule.class_bookings.where(status: %w[booked waitlisted]).find_each do |booking|
      booking.membership.with_lock { cancel_record!(booking, refund: true) }
    end
  end

  private

  attr_reader :schedule, :staff

  def create_or_update_booking(membership)
    ClassBookingEligibility.validate!(membership, schedule)
    booking = schedule.class_bookings.find_or_initialize_by(membership: membership)
    return booking if %w[booked waitlisted attended].include?(booking.status) && booking.persisted?

    booking.assign_attributes(
      status: available? ? 'booked' : 'waitlisted', queued_at: Time.current,
      checked_in_at: nil, promoted_at: nil, promotion_notified_at: nil
    )
    ClassCreditHandler.deduct!(booking, schedule) if booking.status == 'booked'
    booking.save!
    booking
  end

  def execute_cancellation(booking)
    validate_cancellable!(booking)
    refund = Time.current <= schedule.starts_at - schedule.cancellation_hours.hours
    booking.membership.with_lock { cancel_record!(booking, refund: refund) }
    promote_waitlist!
    booking
  end

  def validate_cancellable!(booking)
    return if %w[booked waitlisted].include?(booking.status) && schedule.starts_at > Time.current

    fail_with(:cannot_cancel)
  end

  def validate_check_in!(booking)
    fail_with(:not_booked) unless booking.status == 'booked'
    return if %w[scheduled ongoing].include?(schedule.status) &&
              Time.current.between?(schedule.starts_at - 30.minutes, schedule.ends_at)

    fail_with(:check_in_window)
  end

  def fail_with(key)
    raise Error, I18n.t("classes.errors.#{key}")
  end

  def ensure_open!
    fail_with(:closed) unless schedule.status == 'scheduled' && schedule.starts_at > Time.current
  end

  def available?
    schedule.class_bookings.where(status: %w[booked attended]).count < schedule.max_capacity
  end

  def cancel_record!(booking, refund:)
    ClassCreditHandler.refund_if_needed!(booking) if refund
    booking.update!(status: 'cancelled')
  end

  def promote!(booking)
    booking.membership.with_lock do
      ClassBookingEligibility.validate!(booking.membership, schedule)
      ClassCreditHandler.deduct!(booking, schedule)
      booking.update!(status: 'booked', promoted_at: Time.current, promotion_notified_at: nil)
    end
  rescue Error
    # An expired, frozen or exhausted member keeps their place but cannot consume a seat.
    nil
  end
end
