# frozen_string_literal: true

class RegisterShopService
  Result = Struct.new(:success?, :shop, :token, :errors, keyword_init: true)

  def self.call(params)
    new(params).call
  end

  def initialize(params)
    @params = params.to_h.symbolize_keys
  end

  def call
    ActiveRecord::Base.transaction do
      shop_params = params.slice(:name, :phone, :email, :password, :password_confirmation)
      shop = Shop.new(shop_params)
      return Result.new(success?: false, errors: shop.errors.full_messages) unless shop.save

      admin_staff = create_admin_staff(shop)
      token = JsonWebToken.encode({ shop_id: shop.id, staff_id: admin_staff.id, role: 'admin' })
      Result.new(success?: true, shop: shop, token: token)
    end
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success?: false, errors: [e.message])
  end

  private

  attr_reader :params

  def create_admin_staff(shop)
    staff_attrs = { name: shop.name || 'Admin', role: 'admin' }
    staff_attrs[:username] = shop.email if Staff.column_names.include?('username')
    if Staff.column_names.include?('password_digest') && params[:password].present?
      staff_attrs[:password] = params[:password]
    end
    shop.staffs.create!(staff_attrs)
  end
end
