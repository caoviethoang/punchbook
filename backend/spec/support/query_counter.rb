# frozen_string_literal: true

# Lightweight SQL query counter using ActiveSupport::Notifications.
# Usage: count_queries { some_code }
#
# Counts only real data queries (SELECT / INSERT / UPDATE / DELETE / WITH).
# Skips Rails internals: schema queries, TRANSACTION statements, SAVEPOINT, etc.
module QueryCounter
  SKIP_PATTERN = /\A\s*(--|BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE|SET\s|SHOW\s|PRAGMA\s)/i
  private_constant :SKIP_PATTERN

  def count_queries(&)
    count = 0
    counter = lambda do |_name, _start, _finish, _id, payload|
      sql = payload[:sql].to_s
      next if sql.match?(SKIP_PATTERN)
      next if payload[:name].in?(%w[SCHEMA EXPLAIN TRANSACTION])

      count += 1
    end

    ActiveSupport::Notifications.subscribed(counter, 'sql.active_record', &)
    count
  end
end

RSpec.configure do |config|
  config.include QueryCounter, type: :request
end
