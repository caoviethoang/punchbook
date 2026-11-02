# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch('MAILER_SENDER', 'PunchBook <noreply@punchbook.vn>')
  layout 'mailer'
end
