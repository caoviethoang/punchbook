# frozen_string_literal: true

class SettingsController < ApiController
  def show
    render json: { shop: ShopSerializer.new(current_shop).as_json }
  end

  def update_profile
    result = UpdateShopProfileService.new(current_shop, profile_params).call

    if result.success?
      render json: { shop: ShopSerializer.new(result.shop).as_json, message: 'Cập nhật thông tin tiệm thành công' }
    else
      render json: { errors: result.errors }, status: :unprocessable_content
    end
  end

  def update_password
    result = ChangeShopPasswordService.new(current_shop, password_params).call

    if result.success?
      render json: { shop: ShopSerializer.new(result.shop).as_json, message: 'Đổi mật khẩu thành công' }
    else
      render json: { errors: result.errors }, status: :unprocessable_content
    end
  end

  def upgrade_plan
    months = params[:months] || 1
    result = UpgradeShopPlanService.new(current_shop, months: months).call

    if result.success?
      render json: {
        shop: ShopSerializer.new(result.shop).as_json,
        message: 'Nâng cấp gói Premium thành công!'
      }
    else
      render json: { errors: result.errors }, status: :unprocessable_content
    end
  end

  private

  def profile_params
    params.permit(:name, :phone, :address, :bank_name, :bank_account_no, :bank_account_name)
  end

  def password_params
    params.permit(:current_password, :password, :password_confirmation)
  end
end
