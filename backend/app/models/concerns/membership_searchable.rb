# frozen_string_literal: true

# Search and check-in priority ordering scopes for Membership.
module MembershipSearchable
  extend ActiveSupport::Concern

  included do
    scope :search_by_query, ->(query) { apply_search_by_query(query) }
    scope :checkin_priority_order, -> { apply_checkin_priority_order }
  end

  module ClassMethods
    def apply_search_by_query(query)
      return all if query.blank?

      raw_query = query.to_s.strip
      digits_only = raw_query.gsub(/\D/, '')
      patterns = {
        q: "%#{sanitize_sql_like(raw_query)}%",
        cq: "%#{sanitize_sql_like(raw_query.sub(/\APUNCHBOOK:/i, ''))}%"
      }
      search_with_patterns(digits_only, patterns)
    end

    def apply_checkin_priority_order
      checked_in_sql = checked_in_today_subquery
      order(Arel.sql("(#{exhausted_order_sql}) ASC"), Arel.sql("(#{checked_in_sql})::int ASC"), :customer_name)
    end

    private

    def search_with_patterns(digits_only, patterns)
      base_sql = 'memberships.customer_name ILIKE :q OR memberships.phone ILIKE :q OR ' \
                 'memberships.card_number ILIKE :q OR memberships.id::text ILIKE :cq'
      if digits_only.present?
        sql = "#{base_sql} OR regexp_replace(memberships.phone, '\\D', '', 'g') ILIKE :pq"
        where(sql, **patterns, pq: "%#{sanitize_sql_like(digits_only)}%")
      else
        where(base_sql, **patterns)
      end
    end

    def exhausted_order_sql
      <<~SQL.squish
        CASE
          WHEN memberships.sessions_left IS NOT NULL AND memberships.sessions_left <= 0 THEN 1
          WHEN memberships.sessions_left IS NULL AND memberships.expires_at IS NOT NULL
               AND memberships.expires_at < CURRENT_DATE THEN 1
          ELSE 0
        END
      SQL
    end
  end
end
