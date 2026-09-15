# frozen_string_literal: true

class MembershipsController < ApiController
  include Paginatable

  def index
    page, per_page = parse_pagination_params
    relation = current_shop.memberships.search_by_query(params[:query]).by_status(params[:status])
    memberships = paginate_relation(relation.includes(:package).order(:customer_name), page, per_page)

    render json: {
      memberships: memberships.map(&:as_api_json),
      meta: build_pagination_meta(relation.count, page, per_page)
    }
  end

  def show
    membership = find_shop_membership(params.expect(:id))
    render json: { membership: membership.as_detail_json }
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

  def destroy
    membership = find_shop_membership(params.expect(:id))
    membership.discard
    render json: { message: 'Đã xóa hội viên thành công' }
  end

  def import_template
    excel_data = ImportMembershipTemplateGenerator.call
    send_data(
      excel_data,
      filename: 'template_import_memberships.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment'
    )
  end

  def import
    if params[:file].blank?
      return render json: { error: 'Vui lòng chọn file để import' }, status: :unprocessable_content
    end

    result = ImportMembershipsService.call(shop: current_shop, file: params[:file])
    render json: {
      total_rows: result.total_rows,
      success_count: result.success_count,
      failed_count: result.failed_count,
      errors: result.errors
    }
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
