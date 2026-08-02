# frozen_string_literal: true

class MembershipsController < ApiController
  INDEX_LIMIT = 50

  def index
    memberships = current_shop.memberships.includes(:package).order(:customer_name).limit(INDEX_LIMIT)
    memberships = apply_query(memberships) if query_param.present?

    render json: { memberships: memberships.map { |m| membership_json(m) } }
  end

  # staff_id is required (shop JWT has no staff identity yet). Must belong to current_shop.
  def check_in
    membership = find_membership
    record = CheckInMembership.call(membership: membership, staff: find_staff)

    render json: {
      membership: membership_json(membership.reload),
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

  def query_param
    params[:query].to_s.strip
  end

  def apply_query(scope)
    pattern = "%#{ActiveRecord::Base.sanitize_sql_like(query_param)}%"
    scope.where(
      'memberships.customer_name ILIKE :q OR memberships.phone ILIKE :q',
      q: pattern
    )
  end

  def membership_json(membership)
    membership.as_json(
      only: %i[id customer_name phone sessions_left expires_at],
      include: { package: { only: %i[id name] } }
    )
  end

  def check_in_json(check_in)
    check_in.as_json(only: %i[id checked_in_at])
  end
end
