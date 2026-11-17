# frozen_string_literal: true

class HardwareCheckInSerializer
  def self.success_payload(result, device:)
    hardware_action = build_hardware_action(true, device)
    base_info = {
      status: 'success', access_granted: true, hardware_action: hardware_action,
      audio_prompt: "Chào mừng #{result[:membership].customer_name} vào tập",
      message: result[:message], device_name: result[:device_name], device_id: device&.id
    }
    base_info.merge(result_details(result))
  end

  def self.result_details(result)
    {
      check_in: result[:check_in]&.as_json(only: %i[id checked_in_at]),
      membership: result[:membership].as_api_json,
      milestone_reached: result[:milestone_reached]
    }
  end

  def self.error_payload(error, device:)
    payload = {
      status: 'error', access_granted: false, hardware_action: build_hardware_action(false, device),
      audio_prompt: error.message, error: error.message, code: error.code
    }
    payload[:membership] = error.membership.as_api_json if error.membership.present?
    payload[:device_id] = device&.id if device.present?
    payload
  end

  def self.pulse_duration(device)
    device&.device_type == 'magnetic_lock' ? 3000 : 1500
  end

  def self.build_hardware_action(access_granted, device)
    {
      relay_trigger: access_granted,
      pulse_ms: access_granted ? pulse_duration(device) : 0,
      buzzer: access_granted ? 'granted' : 'denied',
      led: access_granted ? 'green' : 'red'
    }
  end
end
