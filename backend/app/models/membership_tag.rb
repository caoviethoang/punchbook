# frozen_string_literal: true

class MembershipTag < ApplicationRecord
  belongs_to :membership, inverse_of: :membership_tags
  belongs_to :tag, inverse_of: :membership_tags

  validates :tag_id, uniqueness: { scope: :membership_id }
  validate :tag_and_membership_belong_to_same_shop

  private

  def tag_and_membership_belong_to_same_shop
    return if membership.blank? || tag.blank?
    return if membership.shop_id == tag.shop_id

    errors.add(:tag_id, 'must belong to the same shop as the membership')
  end
end
