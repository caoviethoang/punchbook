# frozen_string_literal: true

class NotificationLogsController < ApiController
  DEFAULT_PER_PAGE = 20

  def index
    scope = build_scope
    page, per_page = pagination_params
    total = scope.count
    logs = scope.offset((page - 1) * per_page).limit(per_page)

    render json: {
      notification_logs: logs.map(&:as_api_json),
      meta: { total: total, page: page, per_page: per_page, total_pages: (total.to_f / per_page).ceil }
    }
  end

  def test
    channel = params.expect(:channel).to_s
    recipient = params[:recipient].presence || default_recipient(channel)

    result = dispatch_test_notification(channel, recipient)
    render json: {
      message: "Gửi thông báo thử nghiệm qua #{channel.upcase} thành công",
      result: result
    }
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_content
  end

  private

  def pagination_params
    page = [params[:page].to_i, 1].max
    per_page = params[:per_page].present? ? [params[:per_page].to_i, 100].min : DEFAULT_PER_PAGE
    [page, per_page]
  end

  def build_scope
    current_shop.notification_logs
                .includes(:membership)
                .recent
                .by_channel(params[:channel])
                .by_status(params[:status])
                .by_event_type(params[:event_type])
  end

  def default_recipient(channel)
    channel == 'email' ? current_shop.email : current_shop.phone
  end

  def dispatch_test_notification(channel, recipient)
    dummy_member = current_shop.memberships.first || create_mock_member(recipient)

    Notifications::NotificationDispatcher.dispatch(
      :welcome,
      shop: current_shop,
      membership: dummy_member,
      channels: [channel]
    )
  end

  def create_mock_member(recipient)
    Membership.new(
      shop: current_shop,
      customer_name: 'Khách hàng thử nghiệm',
      phone: recipient,
      email: recipient.include?('@') ? recipient : nil,
      package: current_shop.packages.first || Package.new(name: 'Gói dùng thử', price: 0)
    )
  end
end
