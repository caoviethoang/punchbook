# frozen_string_literal: true

class MembershipsController < ApiController
  include Paginatable

  before_action :require_admin!, only: %i[import import_template export]

  def index
    page, per_page = parse_pagination_params
    relation = current_shop.memberships.search_by_query(params[:query]).by_status(params[:status])
    memberships = fetch_paginated_memberships(relation, page, per_page)

    render json: {
      memberships: memberships.map(&:as_api_json),
      meta: build_pagination_meta(memberships, page, per_page)
    }
  end

  def export
    excel_data = ExportMembershipsService.call(
      shop: current_shop,
      query: params[:query],
      status: params[:status]
    )
    filename = "memberships_#{current_shop.id}_#{Time.current.strftime('%Y%m%d%H%M%S')}.xlsx"
    send_excel(excel_data, filename)
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

  def update
    membership = find_shop_membership(params.expect(:id))
    if membership.update(update_membership_params)
      render json: { membership: membership.as_api_json }
    else
      render json: { errors: membership.errors.full_messages }, status: :unprocessable_content
    end
  end

  def destroy
    membership = find_shop_membership(params.expect(:id))
    membership.discard
    render json: { message: 'Đã xóa hội viên thành công' }
  end

  def import_template
    send_excel(ImportMembershipTemplateGenerator.call, 'template_import_memberships.xlsx')
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

  def update_membership_params
    params.expect(membership: %i[customer_name phone package_id sessions_left expires_at])
  end

  def find_staff
    if params[:staff_id].present?
      current_shop.staffs.find(params.expect(:staff_id))
    else
      current_staff || current_shop.staffs.first
    end
  end

  def fetch_paginated_memberships(relation, page, per_page)
    ordered = relation.includes(:package, :check_ins)
    ordered = params[:sort] == 'checkin_priority' ? ordered.checkin_priority_order : ordered.order(:customer_name)
    paginate_relation(ordered, page, per_page)
  end

  def send_excel(data, filename)
    send_data(
      data,
      filename: filename,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment'
    )
  end
end
