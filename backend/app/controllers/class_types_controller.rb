# frozen_string_literal: true

class ClassTypesController < ApiController
  before_action :require_admin!, except: %i[index show]

  def index
    render json: { class_types: current_shop.class_types.order(:name) }
  end

  def show
    render json: { class_type: find_type }
  end

  def create
    render json: { class_type: current_shop.class_types.create!(type_params) }, status: :created
  end

  def update
    item = find_type
    item.update!(type_params)
    render json: { class_type: item }
  end

  def destroy
    item = find_type
    return render_validation_errors(item.errors.full_messages) unless item.destroy

    head :no_content
  end

  private

  def find_type
    current_shop.class_types.find(params.expect(:id))
  end

  def type_params
    params.expect(class_type: %i[name description color default_capacity default_duration_minutes])
  end
end
