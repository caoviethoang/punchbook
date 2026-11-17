# frozen_string_literal: true

class HardwareCheckInsController < ApplicationController
  before_action :authenticate_device!

  def create
    dev_name = check_in_params[:device_name].presence || @current_device&.name || 'Hardware Terminal'
    result = HardwareCheckInService.call(
      shop: @device_shop,
      identifier: check_in_params[:identifier],
      device_name: dev_name,
      hardware_device: @current_device
    )

    render_hardware_success(result)
  rescue HardwareCheckInService::Error => e
    render_hardware_error(e)
  end

  def ping
    if @current_device.present?
      @current_device.ping!
      render json: device_ping_response, status: :ok
    else
      render json: shop_ping_response, status: :ok
    end
  end

  private

  def render_hardware_success(result)
    render json: HardwareCheckInSerializer.success_payload(result, device: @current_device), status: :ok
  end

  def render_hardware_error(error)
    status = error.code == 'MEMBERSHIP_NOT_FOUND' ? :not_found : :unprocessable_content
    render json: HardwareCheckInSerializer.error_payload(error, device: @current_device), status: status
  end

  def token_credential
    request.headers['X-Device-Token'].presence || params[:device_token].presence
  end

  def api_key_credential
    request.headers['X-Device-Api-Key'].presence || params[:device_api_key].presence
  end

  def authenticate_device!
    return authenticate_by_device_token(token_credential) if token_credential.present?
    return authenticate_by_api_key(api_key_credential) if api_key_credential.present?

    render_auth_error(I18n.t('errors.hardware.api_key_missing', default: 'Device API Key missing'))
  end

  def authenticate_by_device_token(token)
    device = HardwareDevice.find_by(device_token: token)
    return render_auth_error(I18n.t('errors.hardware.token_invalid', default: 'Invalid Device Token')) if device.blank?

    unless device.is_active?
      msg = I18n.t('errors.hardware.device_disabled', default: 'Device is disabled')
      return render json: { error: msg, code: 'DEVICE_DISABLED' }, status: :forbidden
    end

    @current_device = device
    @device_shop = device.shop
    @current_device.update(last_ping_at: Time.current)
  end

  def authenticate_by_api_key(api_key)
    device = HardwareDevice.find_by(device_token: api_key)
    return authenticate_by_device_token(device.device_token) if device.present?

    @device_shop = Shop.find_by(device_api_key: api_key)
    return if @device_shop.present?

    render_auth_error(I18n.t('errors.hardware.api_key_invalid', default: 'Invalid Device API Key'))
  end

  def render_auth_error(msg)
    render json: { error: msg, code: 'UNAUTHORIZED' }, status: :unauthorized
  end

  def check_in_params
    params.permit(:identifier, :device_name, :device_api_key, :device_token)
  end

  def device_ping_response
    {
      status: 'ok',
      device_id: @current_device.id,
      device_name: @current_device.name,
      device_type: @current_device.device_type,
      location: @current_device.location,
      server_time: Time.current.iso8601,
      is_active: @current_device.is_active
    }
  end

  def shop_ping_response
    {
      status: 'ok',
      shop_id: @device_shop.id,
      shop_name: @device_shop.name,
      server_time: Time.current.iso8601,
      is_active: true
    }
  end
end
