# frozen_string_literal: true

# Service object for handling batch check-in for group classes (yoga, aerobic, etc.).
# Processes each membership independently and aggregates success/failure stats.
class BatchCheckInMemberships
  def self.call(shop:, membership_ids:, staff:)
    new(shop: shop, membership_ids: membership_ids, staff: staff).call
  end

  def initialize(shop:, membership_ids:, staff:)
    @shop = shop
    @membership_ids = Array(membership_ids).map(&:to_s).uniq
    @staff = staff
  end

  def call
    memberships = fetch_indexed_memberships
    results = membership_ids.map { |id| process_single_check_in(id, memberships[id]) }
    build_response(results)
  end

  private

  attr_reader :shop, :membership_ids, :staff

  def fetch_indexed_memberships
    shop.memberships.includes(:package).where(id: membership_ids).index_by(&:id)
  end

  def build_response(results)
    success_count = results.count { |r| r[:status] == 'success' }
    {
      total: results.length,
      success_count: success_count,
      failed_count: results.length - success_count,
      results: results
    }
  end

  def process_single_check_in(id, membership)
    return not_found_result(id) unless membership

    execute_check_in(id, membership)
  rescue CheckInMembership::Error, ActiveRecord::RecordInvalid => e
    failure_result(id, membership.customer_name, error_message(e))
  end

  def execute_check_in(id, membership)
    record = CheckInMembership.call(membership: membership, staff: staff)
    {
      membership_id: id,
      customer_name: membership.customer_name,
      status: 'success',
      membership: membership.reload.as_api_json,
      check_in: record.as_json(only: %i[id checked_in_at])
    }
  end

  def not_found_result(id)
    failure_result(id, 'Không tìm thấy', 'Hội viên không tồn tại trong hệ thống.')
  end

  def failure_result(id, customer_name, error)
    {
      membership_id: id,
      customer_name: customer_name,
      status: 'failed',
      error: error
    }
  end

  def error_message(error)
    case error
    when CheckInMembership::InsufficientSessionsError
      'Hội viên đã hết số buổi tập'
    when CheckInMembership::MembershipExpiredError
      'Gói tập của hội viên đã hết hạn'
    else
      error.message
    end
  end
end
