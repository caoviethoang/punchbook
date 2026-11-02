# frozen_string_literal: true

module Notifications
  class ZaloAdapter
    def self.send_notification(event_type:, **params)
      member = target_member(params)
      return { success: false, skipped: true, reason: 'missing_phone' } if member&.phone.blank?

      template_id = find_template_id(event_type)
      return { success: false, skipped: true, reason: 'missing_zalo_template_id' } if template_id.blank?

      dispatch_zalo(event_type.to_sym, member, template_id, params)
    rescue StandardError => e
      Rails.logger.error("[ZaloAdapter] Error sending #{event_type} to #{member&.phone}: #{e.message}")
      { success: false, channel: 'zalo', recipient: member&.phone, error: e.message }
    end

    def self.dispatch_zalo(event_type, member, template_id, params)
      data = build_template_data(event_type, member, params)
      tracking_id = "pb_zalo_#{event_type}_#{member.id}_#{Time.current.to_i}"
      resp = ZaloService.new.send_template_message(
        phone: member.phone, template_id: template_id, template_data: data, tracking_id: tracking_id
      )

      { success: true, channel: 'zalo', recipient: member.phone, response: resp }
    end
    private_class_method :dispatch_zalo

    def self.target_member(params)
      params[:membership] || params[:check_in]&.membership || params[:invoice]&.membership
    end
    private_class_method :target_member

    def self.find_template_id(event_type)
      mapping = {
        expiring_reminder: 'ZALO_TEMPLATE_ID_MEMBERSHIP_REMINDER',
        welcome: 'ZALO_TEMPLATE_ID_WELCOME',
        check_in_receipt: 'ZALO_TEMPLATE_ID_CHECK_IN',
        payment_receipt: 'ZALO_TEMPLATE_ID_PAYMENT'
      }
      env_key = mapping[event_type.to_sym]
      return nil unless env_key

      ENV.fetch(env_key, '')
    end
    private_class_method :find_template_id

    def self.build_template_data(event_type, member, params)
      case event_type
      when :expiring_reminder
        reminder_template_data(member, params[:payment_url])
      when :check_in_receipt
        check_in_template_data(member, params[:check_in])
      when :payment_receipt
        payment_template_data(member, params[:invoice])
      else
        { 'customer_name' => member.customer_name, 'shop_name' => member.shop.name }
      end
    end
    private_class_method :build_template_data

    def self.reminder_template_data(member, payment_url)
      {
        'customer_name' => member.customer_name,
        'shop_name' => member.shop.name,
        'remaining_sessions' => member.sessions_left.to_i.to_s,
        'expiry_date' => member.expires_at&.strftime('%d/%m/%Y') || '',
        'payment_url' => payment_url.to_s
      }
    end
    private_class_method :reminder_template_data

    def self.check_in_template_data(member, check_in)
      {
        'customer_name' => member.customer_name,
        'shop_name' => member.shop.name,
        'time' => check_in&.checked_in_at&.strftime('%H:%M %d/%m/%Y') || '',
        'remaining_sessions' => member.sessions_left.to_i.to_s
      }
    end
    private_class_method :check_in_template_data

    def self.payment_template_data(member, invoice)
      {
        'customer_name' => member.customer_name,
        'shop_name' => member.shop.name,
        'amount' => invoice&.amount.to_s,
        'package_name' => member.package&.name || ''
      }
    end
    private_class_method :payment_template_data
  end
end
