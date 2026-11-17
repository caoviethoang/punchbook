# frozen_string_literal: true

class KioskController < ApplicationController
  before_action :authenticate_kiosk!, except: %i[login]

  # POST /api/v1/kiosk/login
  def login
    shop = find_shop_for_login
    return render_shop_not_found if shop.blank?
    return render_kiosk_disabled unless shop.kiosk_enabled?

    if shop.authenticate_kiosk_pin(params[:pin])
      render_login_success(shop)
    else
      render json: { error: 'Mã PIN Kiosk không chính xác', code: 'INVALID_PIN' }, status: :unauthorized
    end
  end

  # GET /api/v1/kiosk/config
  def show_config
    render json: {
      shop: shop_config_payload,
      kiosk: kiosk_config_payload
    }, status: :ok
  end

  # POST /api/v1/kiosk/check_in
  def check_in
    result = KioskCheckInService.call(shop: @kiosk_shop, identifier: check_in_params[:identifier])
    status_code = determine_status_code(result)
    render json: result.as_json, status: status_code
  end

  # GET /api/v1/kiosk/invoices/:id/status
  def invoice_status
    invoice = @kiosk_shop.invoices.find(params.expect(:id))
    render json: { id: invoice.id, status: invoice.status, membership_id: invoice.membership_id }, status: :ok
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Không tìm thấy hóa đơn', code: 'INVOICE_NOT_FOUND' }, status: :not_found
  end

  private

  def authenticate_kiosk!
    token = extract_kiosk_token
    if token.blank?
      return render json: { error: 'Vui lòng cung cấp Kiosk token', code: 'UNAUTHORIZED' }, status: :unauthorized
    end

    @kiosk_shop = Shop.find_by(kiosk_token: token)
    if @kiosk_shop.blank?
      return render json: { error: 'Kiosk token không hợp lệ', code: 'UNAUTHORIZED' }, status: :unauthorized
    end

    render_kiosk_disabled unless @kiosk_shop.kiosk_enabled?
  end

  def extract_kiosk_token
    request.headers['X-Kiosk-Token'].presence ||
      bearer_token.presence ||
      params[:kiosk_token].presence ||
      params[:token].presence
  end

  def bearer_token
    header = request.headers['Authorization']
    header.split.last if header.present? && header.start_with?('Bearer ')
  end

  def find_shop_for_login
    return Shop.find_by(id: params[:shop_id]) if params[:shop_id].present?

    find_shop_by_identifier(params[:email].presence || params[:phone].presence)
  end

  def find_shop_by_identifier(ident)
    return nil if ident.blank?

    Shop.find_by(email: ident.to_s.strip.downcase) || Shop.find_by(phone: ident.to_s.strip)
  end

  def render_login_success(shop)
    render json: {
      kiosk_token: shop.kiosk_token,
      shop: { id: shop.id, name: shop.name, address: shop.address, phone: shop.phone }
    }, status: :ok
  end

  def shop_config_payload
    @kiosk_shop.as_json(only: %i[id name address phone bank_name bank_account_no bank_account_name])
  end

  def kiosk_config_payload
    {
      welcome_message: @kiosk_shop.kiosk_welcome_message.presence || 'Chào mừng bạn đến với phòng tập!',
      audio_enabled: @kiosk_shop.kiosk_audio_enabled,
      camera_enabled: true,
      auto_reset_seconds: 3
    }
  end

  def render_shop_not_found
    render json: { error: 'Không tìm thấy thông tin tiệm', code: 'SHOP_NOT_FOUND' }, status: :not_found
  end

  def render_kiosk_disabled
    render json: {
      error: 'Chức năng Kiosk chưa được kích hoạt cho tiệm này',
      code: 'KIOSK_DISABLED'
    }, status: :forbidden
  end

  def check_in_params
    params.permit(:identifier)
  end

  def determine_status_code(result)
    return :ok if result.success?
    return :not_found if result.code == 'MEMBERSHIP_NOT_FOUND'

    :unprocessable_content
  end
end
