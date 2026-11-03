# frozen_string_literal: true

class ClassBooking < ApplicationRecord
  STATUSES = %w[booked waitlisted attended no_show cancelled].freeze
  belongs_to :class_schedule, inverse_of: :class_bookings
  belongs_to :membership, -> { with_discarded }, inverse_of: :class_bookings
  validates :status, inclusion: { in: STATUSES }
  validates :membership_id, uniqueness: { scope: :class_schedule_id }
  validates :queued_at, presence: true
  validate :same_shop
  after_commit :enqueue_promotion_notification, on: :update

  private

  def same_shop
    return unless membership && class_schedule && membership.shop_id != class_schedule.shop_id

    errors.add(:membership, :invalid)
  end

  def enqueue_promotion_notification
    return unless previous_changes.key?('promoted_at') && promoted_at.present?

    ClassBookingPromotionJob.perform_later(id, promoted_at.iso8601(6))
  end
end
