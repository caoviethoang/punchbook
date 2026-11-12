# frozen_string_literal: true

# rubocop:disable Metrics/ClassLength
class MembershipsController < ApiController
  include Paginatable

  before_action :require_admin!, only: %i[import import_template export restore]
  before_action :require_admin_if_deleted!, only: :index

  def index
    page, per_page = parse_pagination_params
    memberships = fetch_paginated_memberships(memberships_relation, page, per_page)

    render json: {
      memberships: MembershipSerializer.batch_api_json(memberships),
      meta: build_pagination_meta(memberships, page, per_page)
    }
  end

  def export
    excel_data = ExportMembershipsService.call(shop: current_shop, query: params[:query], status: params[:status])
    send_excel(excel_data, "memberships_#{current_shop.id}_#{Time.current.strftime('%Y%m%d%H%M%S')}.xlsx")
  end

  def show
    membership = find_shop_membership(params.expect(:id))
    authorize! :read, membership
    render json: { membership: membership.as_detail_json }
  end

  def create
    authorize! :create, Membership
    membership = CreateMembership.call(shop: current_shop, **membership_params.to_h.symbolize_keys)
    render json: { membership: membership.as_api_json }, status: :created
  end

  def update
    membership = find_shop_membership(params.expect(:id))
    authorize! :update, membership
    if membership.update(update_membership_params)
      render json: { membership: membership.as_api_json }
    else
      render_validation_errors(membership.errors.full_messages, details: membership.errors.to_hash)
    end
  end

  def destroy
    membership = find_shop_membership(params.expect(:id))
    authorize! :destroy, membership
    membership.discard
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
    authorize! :check_in, membership
    record = CheckInMembership.call(membership: membership, staff: find_staff)
    render json: { membership: membership.reload.as_api_json, check_in: record.as_json(only: %i[id checked_in_at]) }
  end

  def freeze
    membership = find_shop_membership(params.expect(:id))
    updated = FreezeMembership.call(
      membership: membership,
      staff: current_staff,
      freeze_until: params[:freeze_until],
      reason: params[:reason]
    )
    render json: { membership: updated.as_detail_json, message: 'Đã bảo lưu thẻ hội viên thành công' }
  rescue FreezeMembership::Error => e
    render_business_exception(e)
  end

  def unfreeze
    membership = find_shop_membership(params.expect(:id))
    updated = UnfreezeMembership.call(
      membership: membership,
      staff: current_staff,
      reason: params[:reason]
    )
    render json: { membership: updated.as_detail_json, message: 'Đã mở khóa bảo lưu thành công' }
  rescue UnfreezeMembership::Error => e
    render_business_exception(e)
  end

  def transfer
    membership = find_shop_membership(params.expect(:id))
    result = execute_membership_transfer(membership)
    render_transfer_success(result)
  rescue TransferMembership::IneligibleMembershipError, TransferMembership::InvalidTargetError => e
    render json: { error: e.message }, status: :unprocessable_content
  end

  private

  def execute_membership_transfer(membership)
    TransferMembership.call(
      source_membership: membership, target_customer_name: params[:target_customer_name],
      target_phone: params[:target_phone], staff: find_staff,
      transfer_fee: params[:transfer_fee], note: params[:note]
    )
  end

  def render_transfer_success(result)
    render json: {
      source_membership: result[:source_membership].as_api_json,
      target_membership: result[:target_membership].as_api_json,
      transfer: result[:transfer].as_api_json,
      invoice: result[:invoice]&.as_api_json,
      message: 'Chuyển nhượng thẻ hội viên thành công'
    }
  end

  def membership_params
    params.expect(membership: [:customer_name, :phone, :package_id, :notes, :card_number, :email,
                               :assigned_staff_id, { tag_ids: [] }])
  end

  def update_membership_params
    params.expect(membership: [:customer_name, :phone, :package_id, :sessions_left, :expires_at, :notes,
                               :card_number, :email, :assigned_staff_id, { tag_ids: [] }])
  end

  def find_staff
    return current_shop.staffs.find(params.expect(:staff_id)) if params[:staff_id].present?

    current_staff || current_shop.staffs.first
  end

  def require_admin_if_deleted!
    require_admin! if params[:status] == 'deleted'
  end

  def memberships_relation
    scoped = apply_trainer_filter(base_memberships_scope).search_by_query(params[:query]).with_tags(params[:tag_ids])
    params[:status] == 'deleted' ? scoped : scoped.by_status(params[:status])
  end

  def base_memberships_scope
    params[:status] == 'deleted' ? current_shop.memberships.with_discarded.discarded : current_shop.memberships
  end

  def apply_trainer_filter(scope)
    scope = scope.assigned_to(current_staff.id) if current_staff&.trainer?
    scope = scope.assigned_to(params[:assigned_staff_id]) if params[:assigned_staff_id].present?
    scope
  end

  def fetch_paginated_memberships(relation, page, per_page)
    ordered = relation.preload(:package, :shop, :assigned_staff, :tags)
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
# rubocop:enable Metrics/ClassLength
