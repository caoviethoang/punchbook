# frozen_string_literal: true

# Service object that encapsulates creating a new Membership from a Package.
# Lifting this out of MembershipsController keeps the controller thin.
class CreateMembership
  class Error < StandardError; end

  def self.call(shop:, customer_name:, phone:, package_id:)
    new(shop: shop, customer_name: customer_name, phone: phone, package_id: package_id).call
  end

  def initialize(shop:, customer_name:, phone:, package_id:)
    @shop = shop
    @customer_name = customer_name
    @phone = phone
    @package_id = package_id
  end

  # Returns the persisted Membership on success.
  # Raises ActiveRecord::RecordNotFound if the package doesn't belong to the shop.
  # Callers may also rescue ActiveRecord::RecordInvalid for validation errors.
  def call
    package = shop.packages.find(package_id)
    membership = shop.memberships.build(
      customer_name: customer_name,
      phone: phone,
      package: package
    )
    membership.apply_package_init
    membership.save!
    membership
  end

  private

  attr_reader :shop, :customer_name, :phone, :package_id
end
