# frozen_string_literal: true

class KioskCheckInResult
  attr_reader :status, :code, :message, :audio_text, :membership, :check_in, :milestone_reached, :renewal

  def initialize(status:, message:, code: nil, audio_text: nil, membership: nil, check_in: nil, # rubocop:disable Metrics/ParameterLists
                 milestone_reached: nil, renewal: nil)
    @status = status
    @code = code
    @message = message
    @audio_text = audio_text
    @membership = membership
    @check_in = check_in
    @milestone_reached = milestone_reached
    @renewal = renewal
  end

  def success?
    @status == :success
  end

  # rubocop:disable Metrics/AbcSize, Metrics/MethodLength
  def as_json
    payload = {
      status: status.to_s,
      message: message,
      audio_text: audio_text
    }
    payload[:code] = code if code.present?
    payload[:membership] = membership.as_api_json if membership.present?
    payload[:check_in] = check_in.as_json(only: %i[id checked_in_at]) if check_in.present?
    payload[:milestone_reached] = milestone_reached if milestone_reached.present?
    payload[:renewal] = renewal if renewal.present?
    payload
  end
  # rubocop:enable Metrics/AbcSize, Metrics/MethodLength
end
