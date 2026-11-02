# frozen_string_literal: true

class HardwareCheckInsController < ApplicationController
  before_action :authenticate_device!

  def create
    result = HardwareCheckInService.call(
      shop: @device_shop,
      identifier: check_in_params[:identifier],
      device_name: check_in_params[:device_name]
    )

    render_hardware_success(result)
  rescue HardwareCheckInService::Error => e
    render_hardware_error(e)
  end

  private

  def render_hardware_success(result)
    render json: {
      status: 'success',
      message: result[:message],
      device_name: result[:device_name],
      membership: result[:membership].as_api_json
    }, status: :ok
  end

  def authenticate_device!
    api_key = request.headers['X-Device-Api-Key'].presence || params[:device_api_key].presence
    if api_key.blank?
      msg = I18n.t('errors.hardware.api_key_missing', default: 'Device API Key missing')
      return render json: { error: msg, code: 'UNAUTHORIZED' }, status: :unauthorized
    end

    @device_shop = Shop.find_by(device_api_key: api_key)
    return if @device_shop.present?

    invalid_msg = I18n.t('errors.hardware.api_key_invalid', default: 'Invalid Device API Key')
    render json: { error: invalid_msg, code: 'UNAUTHORIZED' }, status: :unauthorized
  end

  def check_in_params
    params.permit(:identifier, :device_name, :device_api_key)
  end

  def render_hardware_error(error)
    payload = {
      error: error.message,
      code: error.code
    }
    payload[:membership] = error.membership.as_api_json if error.membership.present?

    status = error.code == 'MEMBERSHIP_NOT_FOUND' ? :not_found : :unprocessable_content
    render json: payload, status: status
  end
end
