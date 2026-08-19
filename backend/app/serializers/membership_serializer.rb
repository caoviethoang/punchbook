# frozen_string_literal: true

# Responsible for converting a Membership into JSON-safe hashes.
# Keeps the model free of presentation concerns.
class MembershipSerializer
  def initialize(membership)
    @membership = membership
  end

  # Used by MembershipsController (index, create, check_in) and InvoicesController.
  def as_api_json
    membership.as_json(
      only: %i[id customer_name phone sessions_left expires_at],
      include: { package: { only: %i[id name] } }
    )
  end

  # Used by DashboardController — adds the computed status field.
  def as_dashboard_json
    as_api_json.merge('status' => membership.status)
  end

  private

  attr_reader :membership
end
