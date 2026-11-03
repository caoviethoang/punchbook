# frozen_string_literal: true

class ClassAttendanceRecorder
  def self.call(booking:, schedule:, staff:)
    new(booking: booking, schedule: schedule, staff: staff).call
  end

  def initialize(booking:, schedule:, staff:)
    @booking = booking
    @schedule = schedule
    @staff = staff
  end

  def call
    membership = @booking.membership
    ClassBookingEligibility.validate!(membership, @schedule, prepaid: @booking.credit_deducted?)
    dispatch_check_in(membership)
    @booking.update!(status: 'attended', checked_in_at: Time.current)
  end

  private

  def dispatch_check_in(membership)
    if @booking.credit_deducted?
      record_prepaid_attendance(membership)
    else
      CheckInMembership.call(
        membership: membership,
        staff: @staff,
        extra_audit_details: { class_schedule_id: @schedule.id }
      )
    end
  end

  def record_prepaid_attendance(membership)
    record = membership.check_ins.create!(staff: @staff, checked_in_at: Time.current)
    AuditLog.log_check_in!(
      shop: @schedule.shop,
      staff: @staff,
      membership: membership,
      checked_in_at: record.checked_in_at,
      class_schedule_id: @schedule.id
    )
  end
end
