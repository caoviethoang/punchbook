# frozen_string_literal: true

class PackageSerializer
  FIELDS = %i[id shop_id name price sessions_count duration_days package_category_id].freeze

  def initialize(package)
    @package = package
  end

  def as_json(_options = nil)
    package.as_json(only: FIELDS).merge(
      'category_name' => package.package_category&.name
    )
  end

  private

  attr_reader :package
end
