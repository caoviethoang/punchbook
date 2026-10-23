# frozen_string_literal: true

class BatchCheckInsController < ApiController
  def create
    membership_ids = Array(params[:membership_ids]).compact_blank
    return render_empty_error if membership_ids.empty?

    result = BatchCheckInMemberships.call(
      shop: current_shop,
      membership_ids: membership_ids,
      staff: find_staff
    )
    render json: result
  end

  private

  def render_empty_error
    render_unprocessable_message('Vui lòng chọn ít nhất một hội viên để điểm danh', code: 'MEMBERSHIPS_REQUIRED')
  end

  def find_staff
    return current_shop.staffs.find(params.expect(:staff_id)) if params[:staff_id].present?

    current_staff || current_shop.staffs.first
  end
end
