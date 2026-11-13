# frozen_string_literal: true

class TagsController < ApiController
  def index
    authorize! :read, Tag
    tags = current_shop.tags.order(:name)
    render json: { tags: tags.as_json(only: %i[id shop_id name color]) }
  end

  def create
    authorize! :create, Tag
    tag = current_shop.tags.new(tag_params)
    if tag.save
      render json: { tag: tag.as_json(only: %i[id shop_id name color]) }, status: :created
    else
      render_validation_errors(tag.errors.full_messages, details: tag.errors.to_hash)
    end
  end

  def update
    tag = current_shop.tags.find(params.expect(:id))
    authorize! :update, tag
    if tag.update(tag_params)
      render json: { tag: tag.as_json(only: %i[id shop_id name color]) }
    else
      render_validation_errors(tag.errors.full_messages, details: tag.errors.to_hash)
    end
  end

  def destroy
    tag = current_shop.tags.find(params.expect(:id))
    authorize! :destroy, tag
    tag.destroy!
    render json: { message: 'Đã xóa nhãn thành công' }
  end

  private

  def tag_params
    params.expect(tag: %i[name color])
  end
end
