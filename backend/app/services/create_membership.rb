# frozen_string_literal: true

# Service object that encapsulates creating a new Membership from a Package.
# Lifting this out of MembershipsController keeps the controller thin.
class CreateMembership
  OPTIONAL_ATTRS = %i[card_number email assigned_staff_id tag_ids].freeze

  def self.call(shop:, **attrs)
    new(shop: shop, **attrs).call
  end

  def initialize(shop:, **attrs)
    @shop = shop
    @attrs = attrs
  end

  # Returns the persisted Membership on success.
  # Raises ActiveRecord::RecordNotFound if the package doesn't belong to the shop.
  # Callers may also rescue ActiveRecord::RecordInvalid for validation errors.
  def call
    package = shop.packages.find(attrs[:package_id])
    membership = build_membership(package)
    membership.apply_package_init
    membership.save!
    SendNotificationJob.perform_later(:welcome, shop_id: shop.id, membership_id: membership.id)
    membership
  end

  private

  attr_reader :shop, :attrs

  def build_membership(package)
    params = { customer_name: attrs[:customer_name], phone: attrs[:phone], package: package, notes: attrs[:notes] }
    OPTIONAL_ATTRS.each { |key| params[key] = attrs[key].presence }
    shop.memberships.build(params)
  end
end
