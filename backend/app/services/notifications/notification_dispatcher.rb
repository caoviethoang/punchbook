# frozen_string_literal: true

module Notifications
  class NotificationDispatcher
    def self.dispatch(event_type, shop:, **)
      new(event_type: event_type, shop: shop, **).dispatch
    end

    def initialize(event_type:, shop:, **options)
      @event_type = event_type.to_s
      @shop = shop
      @options = options
      @membership = options[:membership] || options[:check_in]&.membership || options[:invoice]&.membership
      @channels = options[:channels]
    end

    def dispatch
      results = []
      phone_res = dispatch_phone_notification
      results << phone_res if phone_res

      email_res = dispatch_email_notification
      results << email_res if email_res
      results
    end

    private

    attr_reader :event_type, :shop, :options, :membership, :channels

    def dispatch_phone_notification
      zalo_res = try_zalo if zalo_enabled?
      return zalo_res if zalo_res&.dig(:success)

      sms_res = try_sms if sms_enabled?
      sms_res || zalo_res
    end

    def zalo_enabled?
      channels.present? ? channels.include?('zalo') : shop.zalo_notifications_enabled?
    end

    def sms_enabled?
      channels.present? ? channels.include?('sms') : shop.sms_notifications_enabled?
    end

    def try_zalo
      res = ZaloAdapter.send_notification(event_type: event_type, **options)
      if res[:success]
        log_delivery(channel: 'zalo', recipient: res[:recipient], status: 'sent')
      elsif !res[:skipped]
        log_delivery(channel: 'zalo', recipient: res[:recipient], status: 'failed', error: res[:error])
      end
      res
    end

    def try_sms
      res = SmsAdapter.send_notification(event_type: event_type, **options)
      status = delivery_status(res)
      recipient = res[:recipient] || membership&.phone
      log_delivery(channel: 'sms', recipient: recipient, status: status, error: res[:error])
      res
    end

    def delivery_status(res)
      return 'sent' if res[:success]
      return 'skipped' if res[:skipped]

      'failed'
    end

    def dispatch_email_notification
      return nil unless email_enabled?

      res = EmailAdapter.send_notification(event_type: event_type, **options)
      record_email_delivery(res) unless res[:skipped]
    end

    def email_enabled?
      channels.present? ? channels.include?('email') : shop.email_notifications_enabled?
    end

    def record_email_delivery(res)
      status = res[:success] ? 'sent' : 'failed'
      recipient = res[:recipient] || membership&.email
      log_delivery(channel: 'email', recipient: recipient, status: status, error: res[:error])
      res
    end

    def log_delivery(channel:, recipient:, status:, error: nil)
      return if recipient.blank?

      NotificationLog.create!(
        shop: shop, membership: membership, channel: channel,
        event_type: event_type, recipient: recipient, status: status,
        error_message: error, sent_at: (Time.current if status == 'sent')
      )
    rescue StandardError => e
      Rails.logger.error("[NotificationDispatcher] Failed to write NotificationLog: #{e.message}")
    end
  end
end
