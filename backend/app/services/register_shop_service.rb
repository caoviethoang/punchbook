# frozen_string_literal: true

class RegisterShopService
  Result = Struct.new(:success?, :shop, :token, :errors, keyword_init: true)

  def self.call(params)
    new(params).call
  end

  def initialize(params)
    @params = params
  end

  def call
    ActiveRecord::Base.transaction do
      shop = Shop.new(params)
      unless shop.save
        return Result.new(success?: false, errors: shop.errors.full_messages)
      end

      admin_staff = shop.staffs.create!(
        name: shop.name || 'Admin',
        username: shop.email,
        password: params[:password],
        role: 'admin'
      )

      token = JsonWebToken.encode({ shop_id: shop.id, staff_id: admin_staff.id, role: 'admin' })
      Result.new(success?: true, shop: shop, token: token)
    end
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success?: false, errors: [e.message])
  end

  private

  attr_reader :params
end
