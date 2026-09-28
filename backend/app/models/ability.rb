# frozen_string_literal: true

class Ability
  include CanCan::Ability

  def initialize(staff)
    return unless staff

    if staff.admin?
      can :manage, :all
    else
      # Staff (Receptionist) role can only manage Memberships & CheckIns
      can :manage, Membership, shop_id: staff.shop_id
      can :manage, CheckIn, membership: { shop_id: staff.shop_id }

      # Read-only access to Packages and PackageCategories
      can :read, Package, shop_id: staff.shop_id
      can :read, PackageCategory, shop_id: staff.shop_id

      # Forbidden from managing Packages, Staff accounts, or Shop settings
      cannot %i[create update destroy], Package
      cannot %i[create update destroy], PackageCategory
      cannot :manage, Staff
      cannot %i[update change_password], Shop
    end
  end
end
