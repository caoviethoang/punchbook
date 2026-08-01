# frozen_string_literal: true

class MembershipsController < ApiController
  INDEX_LIMIT = 50

  def index
    memberships = current_shop.memberships.includes(:package).order(:customer_name).limit(INDEX_LIMIT)
    memberships = apply_query(memberships) if query_param.present?

    render json: { memberships: memberships.map { |m| membership_json(m) } }
  end

  private

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
end
