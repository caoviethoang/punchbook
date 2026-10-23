# frozen_string_literal: true

class MembershipsController < ApiController
  include Paginatable

  before_action :require_admin!, only: %i[import import_template export restore]
  before_action :require_admin_if_deleted!, only: :index

  def index
    page, per_page = parse_pagination_params
    memberships = fetch_paginated_memberships(memberships_relation, page, per_page)

    render json: {
      memberships: memberships.map(&:as_api_json),
      meta: build_pagination_meta(memberships, page, per_page)
    }
  end

  def export
    excel_data = ExportMembershipsService.call(shop: current_shop, query: params[:query], status: params[:status])
    send_excel(excel_data, "memberships_#{current_shop.id}_#{Time.current.strftime('%Y%m%d%H%M%S')}.xlsx")
  end

  def show
    render json: { membership: find_shop_membership(params.expect(:id)).as_detail_json }
  end

  def create
    membership = CreateMembership.call(
      shop: current_shop,
      customer_name: membership_params[:customer_name],
      phone: membership_params[:phone],
      package_id: membership_params[:package_id],
      notes: membership_params[:notes]
    )
    render json: { membership: membership.as_api_json }, status: :created
  end

  def update
    membership = find_shop_membership(params.expect(:id))
    if membership.update(update_membership_params)
      render json: { membership: membership.as_api_json }
    else
      render_validation_errors(membership.errors.full_messages, details: membership.errors.to_hash)
    end
  end

  def destroy
    find_shop_membership(params.expect(:id)).discard
    render json: { message: 'Đã xóa hội viên thành công' }
  end

  def restore
    membership = current_shop.memberships.with_discarded.discarded.find(params.expect(:id))
    membership.undiscard
    render json: { membership: membership.reload.as_api_json, message: 'Đã khôi phục hội viên thành công' }
  end

  def import_template
    send_excel(ImportMembershipTemplateGenerator.call, 'template_import_memberships.xlsx')
  end

  def import
    return render_unprocessable_message('Vui lòng chọn file để import', code: 'FILE_MISSING') if params[:file].blank?

    result = ImportMembershipsService.call(shop: current_shop, file: params[:file])
    render json: { total_rows: result.total_rows, success_count: result.success_count,
                   failed_count: result.failed_count, errors: result.errors }
  end

  def check_in
    membership = find_shop_membership(params.expect(:id))
    record = CheckInMembership.call(membership: membership, staff: find_staff)
    render json: { membership: membership.reload.as_api_json, check_in: record.as_json(only: %i[id checked_in_at]) }
  end

  private

  def membership_params
    params.expect(membership: %i[customer_name phone package_id notes])
  end

  def update_membership_params
    params.expect(membership: %i[customer_name phone package_id sessions_left expires_at notes])
  end

  def find_staff
    return current_shop.staffs.find(params.expect(:staff_id)) if params[:staff_id].present?

    current_staff || current_shop.staffs.first
  end

  def require_admin_if_deleted!
    require_admin! if params[:status] == 'deleted'
  end

  def memberships_relation
    scope = params[:status] == 'deleted' ? current_shop.memberships.with_discarded.discarded : current_shop.memberships
    scoped = scope.search_by_query(params[:query])
    params[:status] == 'deleted' ? scoped : scoped.by_status(params[:status])
  end

  def fetch_paginated_memberships(relation, page, per_page)
    ordered = relation.includes(:package, :check_ins)
    ordered = if params[:status] == 'deleted'
                ordered.order(discarded_at: :desc)
              else
                params[:sort] == 'checkin_priority' ? ordered.checkin_priority_order : ordered.order(:customer_name)
              end
    paginate_relation(ordered, page, per_page)
  end

  def send_excel(data, filename)
    send_data data, filename: filename, disposition: 'attachment',
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  end
end
