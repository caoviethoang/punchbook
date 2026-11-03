# frozen_string_literal: true

class ClassSchedule < ApplicationRecord
  STATUSES = %w[scheduled ongoing completed cancelled].freeze
  belongs_to :shop
  belongs_to :class_type
  belongs_to :instructor, class_name: 'Staff', optional: true
  has_many :class_bookings, dependent: :restrict_with_error
  validates :starts_at, :ends_at, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :credit_policy, inclusion: { in: %w[attendance booking] }
  validates :max_capacity, numericality: { only_integer: true, in: 1..500 }
  validates :cancellation_hours, numericality: { only_integer: true, in: 0..168 }
  validate :validate_tenant_associations
  validate :validate_time_ordering
  validate :validate_instructor_availability
  validate :validate_capacity

  def occupied_count
    class_bookings.count { |booking| %w[booked attended].include?(booking.status) }
  end

  private

  def validate_tenant_associations
    errors.add(:class_type, :invalid) if class_type && class_type.shop_id != shop_id
    errors.add(:instructor, :invalid) if instructor && instructor.shop_id != shop_id
  end

  def validate_time_ordering
    errors.add(:ends_at, :invalid) if starts_at && ends_at && ends_at <= starts_at
  end

  def validate_instructor_availability
    return unless instructor_id && starts_at && ends_at && active_status?

    errors.add(:instructor, I18n.t('classes.errors.instructor_busy')) if instructor_overlapping?
  end

  def active_status?
    %w[scheduled ongoing].include?(status)
  end

  def instructor_overlapping?
    shop.class_schedules
        .where(instructor_id: instructor_id, status: %w[scheduled ongoing])
        .where.not(id: id)
        .exists?(['starts_at < ? AND ends_at > ?', ends_at, starts_at])
  end

  def validate_capacity
    return unless max_capacity && persisted? && max_capacity < occupied_count

    errors.add(:max_capacity, I18n.t('classes.errors.capacity_below_bookings'))
  end
end
