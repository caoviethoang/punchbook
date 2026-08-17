class ZaloZbsPushService
  ZBS_TOKEN = ENV.fetch('ZALO_ZBS_TOKEN', 'default_token')
  ZBS_URL = ENV.fetch('ZALO_ZBS_WEBHOOK_URL', 'https://dev.zalo.me/v1/push')

  def self.schedule_daily_reminders
    User
      .where('last_zalo_pushed_at' => 1.day.ago..)
      .where(plan: { type: 'paid' })
      .find_each(batch_size: 25) do |user|
      send_notification(
        user,
        message: generate_reminder_message(user)
      )
    end
  end

  def self.send_notification(user, message:)
    headers = {
      'Content-Type' => 'application/json',
      'Authorization' => "Bearer #{ZBS_TOKEN}"
    }

    payload = {
      'recipient_id': user.id,
      'data': {
        'text': message,
        'plan_type': user.plan&.type,
        'timestamp': Time.current.iso8601
      }
    }

    response = Net::HTTP.post_form(URI.parse("#{ZBS_URL}/#{user.id}"),
      payload.to_json,
      headers: headers)

    user.update_column(:last_zalo_pushed_at, Time.current) if response.code.to_i == 200

    response
  end

  def self.generate_reminder_message(user)
    "#{user.last_name || user.first_name}, #{I18n.l('time.in_1_day', count: 1, scope: :date)} to punch!"
  end

  def self.get_pending_users
    User
      .where('last_zalo_pushed_at' => 1.day.ago..)
      .where(plan: { type: 'paid' })
      .includes(:punches)
      .order(:last_punch_at)
  end
end

class ZaloZbsJob < ApplicationJob
  queue_as :zalo_zbs

  def perform(user_id:, message:)
    user = User.find_by(id: user_id)
    return if user.blank?

    headers = {
      'Content-Type' => 'application/json',
      'Authorization' => "Bearer #{ZaloZbsPushService::ZBS_TOKEN}"
    }

    payload = {
      'recipient_id': user_id,
      'data': {
        'text': message,
        'timestamp': Time.now.iso8601
      }
    }

    response = Net::HTTP.post_form(URI.parse("#{ZaloZbsPushService::ZBS_URL}/#{user_id}"),
      payload.to_json,
      headers: headers)

    user.update_column(:last_zalo_pushed_at, Time.current) if response.code.to_i == 200

    {
      status: :success,
      response: response,
      user: user
    }
  rescue StandardError => e
    {
      status: :error,
      error: e.message,
      user: user
    }
  end
end

class ZalozApp
  module ZalozZbs
    def daily_reminder_scheduled?
      true
    end
  end
end