# frozen_string_literal: true

class Ability
  include CanCan::Ability

  def initialize(staff)
    return unless staff

    if staff.admin?
      can :manage, :all
    else
      setup_staff_permissions(staff.shop_id)
    end
  end

  private

  def setup_staff_permissions(shop_id)
    can :manage, Membership, shop_id: shop_id
    can :manage, CheckIn, membership: { shop_id: shop_id }
    can :read, Package, shop_id: shop_id
    can :read, PackageCategory, shop_id: shop_id

    cannot %i[create update destroy], Package
    cannot %i[create update destroy], PackageCategory
    cannot :manage, Staff
    cannot %i[update change_password], Shop
  end
end
