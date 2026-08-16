# frozen_string_literal: true

class PackagesController < ApiController
  def index
    packages = current_shop.packages.order(:name)
    render json: { packages: packages.as_json(only: %i[id name price sessions_count duration_days]) }
  end

  def create
    package = current_shop.packages.build(package_params)

    if package.save
      render json: package, status: :created
    else
      render json: { errors: package.errors.full_messages }, status: :unprocessable_content
    end
  end

  private

  def package_params
    params.expect(package: %i[name price sessions_count duration_days])
  end
end
