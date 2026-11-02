# frozen_string_literal: true

module Notifications
  class EmailAdapter
    def self.send_notification(event_type:, **params)
      target_email = resolve_email(params)
      return { success: false, skipped: true, reason: 'missing_email' } if target_email.blank?

      mail = build_mail(event_type.to_sym, params)
      mail.deliver_now

      { success: true, channel: 'email', recipient: target_email }
    rescue StandardError => e
      Rails.logger.error("[EmailAdapter] Failed to send #{event_type} to #{target_email}: #{e.message}")
      { success: false, channel: 'email', recipient: target_email, error: e.message }
    end

    def self.resolve_email(params)
      target = params[:membership] || params[:invoice]&.membership || params[:check_in]&.membership
      target&.email
    end
    private_class_method :resolve_email

    def self.build_mail(event_type, params)
      action = mailer_actions(params)[event_type]
      raise ArgumentError, "Unsupported email event_type: #{event_type}" unless action

      action.call
    end
    private_class_method :build_mail

    def self.mailer_actions(params)
      {
        welcome: -> { MembershipMailer.welcome_email(params[:membership]) },
        check_in_receipt: -> { MembershipMailer.check_in_receipt_email(params[:check_in]) },
        payment_receipt: -> { MembershipMailer.payment_receipt_email(params[:invoice]) },
        expiring_reminder: lambda {
          MembershipMailer.expiring_reminder_email(params[:membership], payment_url: params[:payment_url])
        }
      }
    end
    private_class_method :mailer_actions
  end
end
