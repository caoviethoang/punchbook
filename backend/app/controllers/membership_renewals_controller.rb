# frozen_string_literal: true

class MembershipRenewalsController < ApiController
  def create
    membership = current_shop.memberships.find(params.expect(:id))
    authorize! :update, membership
    render json: format_response(RenewMembership.call(**renewal_args(membership)))
  rescue RenewMembership::Error => e
    render json: { error: e.message }, status: :unprocessable_content
  end

  private

  def renewal_args(membership)
    {
      membership: membership,
      package: find_renewal_package(membership),
      staff: find_staff,
      auto_check_in: ActiveModel::Type::Boolean.new.cast(params[:auto_check_in]),
      assigned_staff_id: params.key?(:assigned_staff_id) ? params[:assigned_staff_id] : RenewMembership::UNSET
    }
  end

  def format_response(result)
    {
      membership: result[:membership].as_api_json,
      invoice: result[:invoice].as_api_json,
      check_in: result[:check_in]&.as_json(only: %i[id checked_in_at])
    }
  end

  def find_renewal_package(membership)
    return membership.package if params[:package_id].blank?

    current_shop.packages.kept.find(params.expect(:package_id))
  end

  def find_staff
    return current_shop.staffs.find(params.expect(:staff_id)) if params[:staff_id].present?

    current_staff || current_shop.staffs.first
  end
end
