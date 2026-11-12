# frozen_string_literal: true

class Ability
  include CanCan::Ability

  def initialize(staff)
    return unless staff

    if staff.admin?
      can :manage, :all
    elsif staff.trainer?
      setup_trainer_permissions(staff)
    else
      setup_staff_permissions(staff.shop_id)
    end
  end

  private

  def setup_trainer_permissions(staff)
    can %i[read update check_in], Membership, shop_id: staff.shop_id, assigned_staff_id: staff.id
    can :manage, CheckIn, membership: { shop_id: staff.shop_id, assigned_staff_id: staff.id }
    can :read, Package, shop_id: staff.shop_id
    can :read, PackageCategory, shop_id: staff.shop_id
    can :read, Tag, shop_id: staff.shop_id

    cannot %i[create destroy], Membership
    cannot %i[create update destroy], Package
    cannot %i[create update destroy], PackageCategory
    cannot :manage, Staff
    cannot %i[update change_password], Shop
  end

  def setup_staff_permissions(shop_id)
    can :manage, Membership, shop_id: shop_id
    can :manage, CheckIn, membership: { shop_id: shop_id }
    can :read, Package, shop_id: shop_id
    can :read, PackageCategory, shop_id: shop_id
    can %i[read create update], Tag, shop_id: shop_id

    cannot %i[create update destroy], Package
    cannot %i[create update destroy], PackageCategory
    cannot :manage, Staff
    cannot %i[update change_password], Shop
  end
end
