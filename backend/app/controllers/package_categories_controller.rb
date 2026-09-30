# frozen_string_literal: true

class PackageCategoriesController < ApiController
  def index
    categories = current_shop.package_categories.order(:name)
    render json: { categories: categories.as_json(only: %i[id shop_id name]) }
  end

  def create
    name = category_params[:name]&.strip
    category = current_shop.package_categories.find_or_create_by!(name: name)
    render json: category.as_json(only: %i[id shop_id name]), status: :created
  end

  def update
    category = current_shop.package_categories.find(params.expect(:id))
    category.update!(category_params)
    render json: category.as_json(only: %i[id shop_id name])
  end

  def destroy
    category = current_shop.package_categories.find(params.expect(:id))
    category.destroy!
    render json: { message: 'Đã xóa danh mục thành công' }
  end

  private

  def category_params
    params.expect(package_category: [:name])
  end
end
