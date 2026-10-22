# frozen_string_literal: true

class MembershipRenewalsController < ApiController
  def create
    membership = current_shop.memberships.find(params.expect(:id))
    package = find_renewal_package(membership)
    auto_check_in = ActiveModel::Type::Boolean.new.cast(params[:auto_check_in])

    result = RenewMembership.call(
      membership: membership, package: package, staff: find_staff, auto_check_in: auto_check_in
    )
    render json: format_response(result)
  rescue RenewMembership::Error => e
    render json: { error: e.message }, status: :unprocessable_content
  end

  private

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
