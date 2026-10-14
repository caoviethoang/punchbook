# frozen_string_literal: true

module Paginatable
  extend ActiveSupport::Concern

  DEFAULT_PER_PAGE = 20
  MAX_PER_PAGE = 100

  private

  def parse_pagination_params
    page = [params[:page].to_i, 1].max
    raw_per_page = params[:per_page].present? ? params[:per_page].to_i : DEFAULT_PER_PAGE
    per_page = raw_per_page.clamp(1, MAX_PER_PAGE)

    [page, per_page]
  end

  def build_pagination_meta(target, page, per_page)
    total_count = target.respond_to?(:total_count) ? target.total_count : target
    total_pages = target.respond_to?(:total_pages) ? target.total_pages : [(total_count.to_f / per_page).ceil, 1].max
    { total: total_count, page: page, per_page: per_page, total_pages: total_pages }
  end

  def paginate_relation(relation, page, per_page)
    relation.page(page).per(per_page)
  end
end
