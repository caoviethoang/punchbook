# frozen_string_literal: true

class StaffSerializer
  FIELDS = %i[id name username role created_at].freeze

  def initialize(staff)
    @staff = staff
  end

  def as_json(_options = nil)
    return nil unless staff

    staff.as_json(only: FIELDS)
  end

  private

  attr_reader :staff
end
