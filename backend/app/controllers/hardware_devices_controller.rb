# frozen_string_literal: true

class HardwareDevicesController < ApiController
  before_action :set_device, only: %i[update destroy regenerate_token]

  def index
    authorize! :read, HardwareDevice
    devices = current_shop.hardware_devices.order(created_at: :desc)
    render json: { devices: devices.map(&:as_api_json) }
  end

  def create
    authorize! :create, HardwareDevice
    device = current_shop.hardware_devices.new(device_params)
    if device.save
      render json: { device: device.as_api_json }, status: :created
    else
      render_validation_errors(device.errors.full_messages, details: device.errors.to_hash)
    end
  end

  def update
    authorize! :update, @device
    if @device.update(device_params)
      render json: { device: @device.as_api_json }
    else
      render_validation_errors(@device.errors.full_messages, details: @device.errors.to_hash)
    end
  end

  def destroy
    authorize! :destroy, @device
    @device.destroy!
    render json: { message: 'Đã xóa thiết bị thành công' }
  end

  def regenerate_token
    authorize! :update, @device
    @device.regenerate_device_token
    @device.save!
    render json: {
      device: @device.as_api_json,
      message: 'Đã tạo lại mã kết nối thiết bị thành công'
    }
  end

  def logs
    authorize! :read, CheckIn
    logs = recent_hardware_check_ins
    render json: { logs: serialize_hardware_logs(logs) }
  end

  private

  def set_device
    @device = current_shop.hardware_devices.find(params.expect(:id))
  end

  def device_params
    params.expect(hardware_device: %i[name device_type location is_active])
  end

  def recent_hardware_check_ins
    current_shop.check_ins
                .where.not(hardware_device_id: nil)
                .includes(:hardware_device, membership: :package)
                .order(checked_in_at: :desc)
                .limit(50)
  end

  def serialize_hardware_logs(check_ins)
    check_ins.map { |ci| serialize_hardware_log(ci) }
  end

  def serialize_hardware_log(check_in)
    dev = check_in.hardware_device
    mship = check_in.membership
    check_in_base_log(check_in, mship).merge(
      device_name: dev&.name || 'Hardware Terminal',
      device_type: dev&.device_type || 'turnstile',
      location: dev&.location,
      access_granted: true
    )
  end

  def check_in_base_log(check_in, mship)
    {
      id: check_in.id,
      checked_in_at: check_in.checked_in_at&.iso8601,
      customer_name: mship.customer_name,
      phone: mship.phone,
      card_number: mship.card_number,
      package_name: mship.package&.name
    }
  end
end
