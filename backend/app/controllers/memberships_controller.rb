# frozen_string_literal: true

class MembershipsController < ApiController
  DEFAULT_PER_PAGE = 20
  MAX_PER_PAGE = 100

  def index
    page, per_page = parse_pagination_params
    base_relation = current_shop.memberships.search_by_query(params[:query]).by_status(params[:status])
    total_count = base_relation.count

    render json: {
      memberships: fetch_paginated_memberships(base_relation, page, per_page).map(&:as_api_json),
      meta: build_pagination_meta(total_count, page, per_page)
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

  def build_pagination_meta(total_count, page, per_page)
    total_pages = [(total_count.to_f / per_page).ceil, 1].max
    { total: total_count, page: page, per_page: per_page, total_pages: total_pages }
  end

  def fetch_paginated_memberships(relation, page, per_page)
    relation.includes(:package)
            .order(:customer_name)
            .offset((page - 1) * per_page)
            .limit(per_page)
  end

  def parse_pagination_params
    page = [params[:page].to_i, 1].max
    raw_per_page = params[:per_page].present? ? params[:per_page].to_i : DEFAULT_PER_PAGE
    per_page = raw_per_page.clamp(1, MAX_PER_PAGE)

    [page, per_page]
  end

  def membership_params
    params.expect(membership: %i[customer_name phone package_id])
  end

  def find_staff
    current_shop.staffs.find(params.expect(:staff_id))
  end
end
