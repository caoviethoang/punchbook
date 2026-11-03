# frozen_string_literal: true

class ClassSchedulesController < ApiController
  before_action :require_admin!, only: %i[create update destroy]
  rescue_from ClassBookingService::Error, with: :render_business_exception

  def index
    from, to = parse_date_range

    schedules = current_shop.class_schedules
                            .includes(:class_type, :instructor, :class_bookings)
                            .where('starts_at < ? AND ends_at > ?', to, from)
                            .order(:starts_at)
    render json: { class_schedules: schedules.map { |item| ClassScheduleSerializer.call(item) } }
  rescue ArgumentError
    render_unprocessable_message(I18n.t('classes.errors.invalid_range'))
  end

  def show
    render_schedule(find_schedule)
  end

  def create
    schedules = CreateClassSchedules.call(
      shop: current_shop,
      attributes: schedule_params.to_h.symbolize_keys,
      recurrence: recurrence_params
    )
    render json: { class_schedules: schedules.map { |item| ClassScheduleSerializer.call(item) } }, status: :created
  end

  def update
    schedule = UpdateClassSchedule.call(schedule: find_schedule, attributes: schedule_params, staff: current_staff)
    render_schedule(schedule)
  end

  def destroy
    schedule = find_schedule
    schedule.with_lock do
      raise ClassBookingService::Error, I18n.t('classes.errors.has_bookings') if schedule.class_bookings.exists?

      schedule.destroy!
    end
    head :no_content
  end

  def book
    mutate_booking(:book)
  end

  def cancel_booking
    mutate_booking(:cancel)
  end

  def check_in_member
    mutate_booking(:check_in)
  end

  private

  def mutate_booking(action)
    schedule = find_schedule
    membership = current_shop.memberships.find(params.expect(:membership_id))
    ClassBookingService.new(schedule: schedule, staff: current_staff).public_send(action, membership)
    render_schedule(schedule.reload)
  end

  def render_schedule(schedule)
    render json: { class_schedule: ClassScheduleSerializer.call(schedule, roster: true) }
  end

  def parse_date_range
    from = Time.iso8601(params.expect(:from))
    to = Time.iso8601(params.expect(:to))
    raise ArgumentError unless to > from && to - from <= 93.days

    [from, to]
  end

  def find_schedule
    current_shop.class_schedules
                .includes(:class_type, :instructor, class_bookings: :membership)
                .find(params.expect(:id))
  end

  def recurrence_params
    params.permit(recurrence: [:until, :time_zone, { weekdays: [] }])[:recurrence]
  end

  def schedule_params
    params.expect(
      class_schedule: %i[
        class_type_id instructor_id starts_at ends_at max_capacity status
        credit_policy cancellation_hours
      ]
    )
  end
end
