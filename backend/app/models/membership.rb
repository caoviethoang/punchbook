# frozen_string_literal: true

class Membership < ApplicationRecord
  include Discard::Model
  include MembershipSearchable
  include MembershipStatusable

  has_paper_trail

  default_scope { kept }

  MAX_FREE_MEMBERSHIPS = 15

  belongs_to :shop, inverse_of: :memberships
  belongs_to :package, -> { with_discarded }, inverse_of: :memberships
  belongs_to :assigned_staff, class_name: 'Staff', optional: true, inverse_of: :assigned_memberships
  has_many :class_bookings, dependent: :restrict_with_error
  belongs_to :transferred_to_membership, class_name: 'Membership', optional: true
  belongs_to :transferred_from_membership, class_name: 'Membership', optional: true
  has_many :check_ins, dependent: :destroy, inverse_of: :membership
  has_many :invoices, dependent: :destroy, inverse_of: :membership
  has_many :membership_reminders, dependent: :destroy, inverse_of: :membership
  has_many :outgoing_transfers, class_name: 'MembershipTransfer', foreign_key: :source_membership_id,
                                dependent: :destroy, inverse_of: :source_membership
  has_many :incoming_transfers, class_name: 'MembershipTransfer', foreign_key: :target_membership_id,
                                dependent: :destroy, inverse_of: :target_membership
  has_many :notification_logs, dependent: :nullify
  has_many :membership_tags, dependent: :destroy, inverse_of: :membership
  has_many :tags, through: :membership_tags

  validates :customer_name, :phone, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :sessions_left, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :card_number, uniqueness: { scope: :shop_id }, allow_blank: true
  validate :validate_free_plan_limit, on: :create
  validate :assigned_staff_belongs_to_shop
  validate :tags_belong_to_shop

  scope :needing_reminder, -> { PaidShopMembershipsNeedingReminderQuery.call(self) }

  scope :with_tags, lambda { |tag_ids|
    ids = Array(tag_ids).flat_map { |v| v.to_s.split(',') }.map(&:strip).compact_blank.uniq
    return all if ids.empty?

    joins(:membership_tags).where(membership_tags: { tag_id: ids }).distinct
  }

  scope :by_status, lambda { |status|
    return all if status.blank? || status.to_s == 'all'

    by_status_query(status.to_s)
  }

  scope :assigned_to, lambda { |staff_id|
    return all if staff_id.blank?

    where(assigned_staff_id: staff_id)
  }

  def checked_in_today?
    today_range = Time.zone.now.all_day
    if check_ins.loaded?
      check_ins.any? { |ci| ci.checked_in_at && today_range.cover?(ci.checked_in_at) }
    else
      check_ins.exists?(checked_in_at: today_range)
    end
  end

  def last_checked_in_at
    if check_ins.loaded?
      check_ins.reject { |ci| ci.checked_in_at.nil? }.max_by(&:checked_in_at)&.checked_in_at
    else
      check_ins.maximum(:checked_in_at)
    end
  end

  def as_api_json
    MembershipSerializer.new(self).as_api_json
  end

  def as_dashboard_json
    MembershipSerializer.new(self).as_dashboard_json
  end

  def as_detail_json
    MembershipSerializer.new(self).as_detail_json
  end

  private

  def validate_free_plan_limit
    return unless shop&.plan == 'free'
    return if shop.memberships.count < MAX_FREE_MEMBERSHIPS

    errors.add(:base, 'Gói Free chỉ được tạo tối đa 15 hội viên. Vui lòng nâng cấp gói trả phí để tạo thêm hội viên.')
  end

  def assigned_staff_belongs_to_shop
    return if assigned_staff_id.blank?
    return if assigned_staff&.shop_id == shop_id

    errors.add(:assigned_staff_id, 'must belong to the same shop')
  end

  def tags_belong_to_shop
    return if tags.empty? || shop_id.blank?
    return if tags.all? { |tag| tag.shop_id == shop_id }

    errors.add(:tag_ids, 'must belong to the same shop')
  end
end
