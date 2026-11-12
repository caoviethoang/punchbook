# frozen_string_literal: true

module Notifications
  class SmsAdapter
    def self.send_notification(event_type:, **params)
      member = target_member(params)
      return { success: false, skipped: true, reason: 'missing_phone' } if member&.phone.blank?

      dispatch_sms(event_type.to_sym, member, params)
    rescue StandardError => e
      Rails.logger.error("[SmsAdapter] Error sending #{event_type} to #{member&.phone}: #{e.message}")
      { success: false, channel: 'sms', recipient: member&.phone, error: e.message }
    end

    def self.dispatch_sms(event_type, member, params)
      message = build_sms_message(event_type, member, params)
      tracking_id = "pb_sms_#{event_type}_#{member.id}_#{Time.current.to_i}"
      resp = SmsService.new.send_sms(phone: member.phone, message: message, tracking_id: tracking_id)

      { success: true, channel: 'sms', recipient: member.phone, response: resp }
    end
    private_class_method :dispatch_sms

    def self.target_member(params)
      params[:membership] || params[:check_in]&.membership || params[:invoice]&.membership
    end
    private_class_method :target_member

    def self.build_sms_message(event_type, member, params)
      case event_type
      when :expiring_reminder then reminder_sms(member, params[:payment_url])
      when :check_in_receipt then check_in_sms(member, params[:check_in])
      when :payment_receipt then payment_sms(member, params[:invoice])
      when :welcome then "[#{member.shop.name}] Chuc mung ban da dang ky the hoi vien tai #{member.shop.name}."
      else "[#{member.shop.name}] Thong bao tu #{member.shop.name}"
      end
    end
    private_class_method :build_sms_message

    def self.reminder_sms(member, payment_url)
      rem = member.sessions_left.present? ? "#{member.sessions_left} buoi" : member.expires_at&.strftime('%d/%m/%Y')
      url_part = payment_url.present? ? " Gia han tai: #{payment_url}" : " LH: #{member.shop.phone}"
      "[#{member.shop.name}] The tap cua ban sap het (#{rem}).#{url_part}"
    end
    private_class_method :reminder_sms

    def self.check_in_sms(member, check_in)
      time = check_in&.checked_in_at&.strftime('%H:%M') || ''
      rem = member.sessions_left.present? ? "Con #{member.sessions_left} buoi." : ''
      "[#{member.shop.name}] Ban da check-in luc #{time}. #{rem}"
    end
    private_class_method :check_in_sms

    def self.payment_sms(member, invoice)
      amt = ActiveSupport::NumberHelper.number_to_currency(invoice.amount, unit: 'd', precision: 0, format: '%n%u')
      "[#{member.shop.name}] Da thanh toan HD #{amt}. Cam on quy khach!"
    end
    private_class_method :payment_sms
  end
end
