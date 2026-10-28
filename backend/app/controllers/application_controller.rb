# frozen_string_literal: true

require 'cancan'

class ApplicationController < ActionController::API
  include Authenticatable

  before_action :set_locale

  rescue_from CanCan::AccessDenied do |_exception|
    render_error(
      I18n.t('errors.forbidden', default: 'Access denied. You do not have permission to perform this action.'),
      code: 'FORBIDDEN',
      status: :forbidden
    )
  end

  private

  def set_locale
    I18n.locale = extract_locale_from_header || I18n.default_locale
  end

  def extract_locale_from_header
    header = request.headers['Accept-Language'].to_s
    return nil if header.blank?

    supported = I18n.available_locales.map(&:to_s)
    parse_locale_tags(header).find { |loc| supported.include?(loc) }&.to_sym
  end

  def parse_locale_tags(header)
    header.split(',').filter_map do |part|
      tag = part.split(';').first.to_s.strip.downcase
      tag.split('-').first.presence
    end
  end

  def render_error(message, code: 'ERROR', status: :unprocessable_content, details: nil)
    payload = { error: message, code: code }
    payload[:details] = details if details.present?
    render json: payload, status: status
  end
end
