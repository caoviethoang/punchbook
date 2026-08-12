# frozen_string_literal: true

class PackagesController < ApiController
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
