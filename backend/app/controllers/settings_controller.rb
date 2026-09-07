# frozen_string_literal: true

class SettingsController < ApiController
  def show
    render json: { shop: shop_json(current_shop) }
  end

  def update_profile
    result = UpdateShopProfileService.new(current_shop, profile_params).call

    if result.success?
      render json: { shop: shop_json(result.shop), message: 'Cập nhật thông tin tiệm thành công' }
    else
      render json: { errors: result.errors }, status: :unprocessable_content
    end
  end

  def update_password
    result = ChangeShopPasswordService.new(current_shop, password_params).call

    if result.success?
      render json: { shop: shop_json(result.shop), message: 'Đổi mật khẩu thành công' }
    else
      render json: { errors: result.errors }, status: :unprocessable_content
    end
  end

  private

  def profile_params
    params.permit(:name, :phone, :address)
  end

  def password_params
    params.permit(:current_password, :password, :password_confirmation)
  end

  def shop_json(shop)
    shop.as_json(only: %i[id name phone address email plan plan_expires_at])
  end
end
