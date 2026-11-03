# frozen_string_literal: true

# Recurrences are materialized so each occurrence has its own capacity and roster.
class CreateClassSchedules
  def self.call(shop:, attributes:, recurrence: nil)
    new(shop, attributes, recurrence).call
  end

  def initialize(shop, attributes, recurrence)
    @shop = shop
    @attributes = attributes
    @recurrence = recurrence
  end

  def call
    @shop.with_lock do
      first = build_and_validate_first!
      dates = occurrence_starts(first)
      persist_schedules(first, dates)
    end
  end

  private

  def build_and_validate_first!
    first = @shop.class_schedules.build(@attributes)
    first.validate!
    raise ClassBookingService::Error, I18n.t('classes.errors.past_schedule') if first.starts_at <= Time.current

    first
  end

  def persist_schedules(first, dates)
    duration = first.ends_at - first.starts_at
    series_id = SecureRandom.uuid if dates.size > 1
    dates.map do |starts_at|
      @shop.class_schedules.create!(
        @attributes.merge(starts_at: starts_at, ends_at: starts_at + duration, series_id: series_id)
      )
    end
  end

  def occurrence_starts(first)
    return [first.starts_at] if @recurrence.blank?

    start, until_date, weekdays = parse_recurrence_inputs(first)
    validate_recurrence_params!(start, until_date, weekdays)
    collect_recurrence_dates(start, until_date, weekdays)
  rescue ArgumentError, TypeError
    raise ClassBookingService::Error, I18n.t('classes.errors.invalid_recurrence')
  end

  def parse_recurrence_inputs(first)
    zone = ActiveSupport::TimeZone[@recurrence[:time_zone].presence || 'Asia/Ho_Chi_Minh']
    until_date = Date.iso8601(@recurrence[:until].to_s)
    weekdays = Array(@recurrence[:weekdays]).map { |day| Integer(day) }
    start = first.starts_at.in_time_zone(zone) if zone
    [start, until_date, weekdays]
  end

  def validate_recurrence_params!(start, until_date, weekdays)
    valid_window = start && until_date.between?(start.to_date, start.to_date + 84)
    valid_weekdays = weekdays.any? && (weekdays - (0..6).to_a).empty?
    raise ArgumentError unless valid_window && valid_weekdays
  end

  def collect_recurrence_dates(start, until_date, weekdays)
    dates = (0..(until_date - start.to_date).to_i).filter_map do |offset|
      date = start.advance(days: offset)
      date if weekdays.include?(date.wday)
    end
    raise ArgumentError if dates.empty?

    dates
  end
end
