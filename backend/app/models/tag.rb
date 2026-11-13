# frozen_string_literal: true

class Tag < ApplicationRecord
  DEFAULT_COLOR = '#6366f1'
  HEX_COLOR_REGEX = /\A#[0-9a-fA-F]{6}\z/

  belongs_to :shop, inverse_of: :tags
  has_many :membership_tags, dependent: :destroy, inverse_of: :tag
  has_many :memberships, through: :membership_tags

  before_validation :normalize_attributes

  validates :name, presence: true, length: { maximum: 50 },
                   uniqueness: { scope: :shop_id, case_sensitive: false }
  validates :color, presence: true, format: { with: HEX_COLOR_REGEX }

  private

  def normalize_attributes
    self.name = name.to_s.strip if name.present?
    self.color = color.present? ? color.to_s.strip.downcase : DEFAULT_COLOR
  end
end
