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

  # staff_id is required (shop JWT has no staff identity yet). Must belong to current_shop.
  def check_in
    membership = find_membership
    record = CheckInMembership.call(membership: membership, staff: find_staff)

    render json: {
      membership: membership.reload.as_api_json,
      check_in: check_in_json(record)
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Not found' }, status: :not_found
  rescue ActionController::ParameterMissing, CheckInMembership::Error => e
    render json: { error: e.message }, status: :unprocessable_content
  end

  private

  def find_membership
    current_shop.memberships.includes(:package).find(params.expect(:id))
  end

  def find_staff
    current_shop.staffs.find(params.expect(:staff_id))
  end

  def check_in_json(check_in)
    check_in.as_json(only: %i[id checked_in_at])
  end
end
