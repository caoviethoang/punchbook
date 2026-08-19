# frozen_string_literal: true

class PackageSerializer
  FIELDS = %i[id shop_id name price sessions_count duration_days].freeze

  def initialize(package)
    @package = package
  end

  def as_json(_options = nil)
    package.as_json(only: FIELDS)
  end

  private

  attr_reader :package
end
