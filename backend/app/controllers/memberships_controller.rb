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
    membership = build_membership_from_package

    if membership.save
      render json: { membership: membership.as_api_json }, status: :created
    else
      render json: { errors: membership.errors.full_messages }, status: :unprocessable_content
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Not found' }, status: :not_found
  rescue ActionController::ParameterMissing => e
    render json: { error: e.message }, status: :unprocessable_content
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

  def build_membership_from_package
    attrs = membership_params
    package = current_shop.packages.find(attrs[:package_id])
    membership = current_shop.memberships.build(
      customer_name: attrs[:customer_name],
      phone: attrs[:phone],
      package: package
    )
    membership.apply_package_init
    membership
  end

  def membership_params
    params.expect(membership: %i[customer_name phone package_id])
  end

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
