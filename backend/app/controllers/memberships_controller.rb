# frozen_string_literal: true

class MembershipsController < ApiController
  INDEX_LIMIT = 50

  def index
    memberships = current_shop.memberships
                              .includes(:package)
                              .search_by_query(params[:query])
                              .order(:customer_name)
                              .limit(INDEX_LIMIT)

    render json: { memberships: memberships.map(&:as_api_json) }
  end

  def create
    membership = CreateMembership.call(
      shop: current_shop,
      customer_name: membership_params[:customer_name],
      phone: membership_params[:phone],
      package_id: membership_params[:package_id]
    )
    render json: { membership: membership.as_api_json }, status: :created
  end

  # staff_id is required (shop JWT has no staff identity yet). Must belong to current_shop.
  def check_in
    membership = find_shop_membership(params.expect(:id))
    record = CheckInMembership.call(membership: membership, staff: find_staff)

    render json: {
      membership: membership.reload.as_api_json,
      check_in: record.as_json(only: %i[id checked_in_at])
    }
  end

  private

  def membership_params
    params.expect(membership: %i[customer_name phone package_id])
  end

  def find_staff
    current_shop.staffs.find(params.expect(:staff_id))
  end
end
