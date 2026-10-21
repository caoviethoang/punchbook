# frozen_string_literal: true

# Service object that encapsulates creating a new Membership from a Package.
# Lifting this out of MembershipsController keeps the controller thin.
class CreateMembership
  def self.call(shop:, customer_name:, phone:, package_id:, notes: nil)
    new(shop: shop, customer_name: customer_name, phone: phone, package_id: package_id, notes: notes).call
  end

  def initialize(shop:, customer_name:, phone:, package_id:, notes: nil)
    @shop = shop
    @customer_name = customer_name
    @phone = phone
    @package_id = package_id
    @notes = notes
  end

  # Returns the persisted Membership on success.
  # Raises ActiveRecord::RecordNotFound if the package doesn't belong to the shop.
  # Callers may also rescue ActiveRecord::RecordInvalid for validation errors.
  def call
    package = shop.packages.find(package_id)
    membership = shop.memberships.build(
      customer_name: customer_name,
      phone: phone,
      package: package,
      notes: notes
    )
    membership.apply_package_init
    membership.save!
    membership
  end

  private

  attr_reader :shop, :customer_name, :phone, :package_id, :notes
end
