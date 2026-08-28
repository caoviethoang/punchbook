# frozen_string_literal: true

require 'sidekiq-cron'

Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/1') }

  # Load cron schedules from config/sidekiq.yml if it exists
  schedule_file = Rails.root.join('config/sidekiq.yml')
  if schedule_file.exist?
    schedule = YAML.load_file(schedule_file)
    Sidekiq::Cron::Job.load_from_hash!(schedule[:schedule]) if schedule && schedule[:schedule]
  end
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/1') }
end
