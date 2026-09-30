# frozen_string_literal: true

class SettingsController < ApiController
  before_action :authorize_shop_update!, only: %i[update_profile update_password upgrade_plan]
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
    result = UpgradeShopPlanService.new(current_shop, months: params[:months] || 1).call

    if result.success?
      render json: format_upgrade_response(result)
    else
      render json: { errors: result.errors }, status: :unprocessable_content
    end
  end

  private

  def format_upgrade_response(result)
    msg = result.checkout_url.present? ? 'Khởi tạo thanh toán thành công!' : 'Nâng cấp gói Premium thành công!'
    {
      shop: ShopSerializer.new(result.shop).as_json,
      checkout_url: result.checkout_url,
      qr_code: result.qr_code,
      payment_id: result.payment&.id,
      message: msg
    }
  end

  def authorize_shop_update!
    authorize! :update, current_shop
  end

  def profile_params
    params.permit(:name, :phone, :address, :bank_name, :bank_account_no, :bank_account_name)
  end

  def password_params
    params.permit(:current_password, :password, :password_confirmation)
  end
end
