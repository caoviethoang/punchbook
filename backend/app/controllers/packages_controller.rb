# frozen_string_literal: true

class PackagesController < ApiController
  def index
    packages = current_shop.packages.order(:name)
    render json: { packages: packages.map { |pkg| PackageSerializer.new(pkg).as_json } }
  end

  def create
    package = current_shop.packages.build(package_params)

    if package.save
      render json: PackageSerializer.new(package).as_json, status: :created
    else
      render_unprocessable(package.errors.full_messages)
    end
  end

  def destroy
    package = current_shop.packages.find(params.expect(:id))
    package.discard
    render json: { message: 'Đã xóa gói dịch vụ thành công' }
  end

  private

  def package_params
    params.expect(package: %i[name price sessions_count duration_days])
  end
end
