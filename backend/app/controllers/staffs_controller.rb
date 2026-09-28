# frozen_string_literal: true

# Controller for managing Staff accounts within a shop.
class StaffsController < ApiController
  before_action :require_admin!, only: %i[create destroy]

  def index
    staffs = current_shop.staffs.order(created_at: :asc)
    render json: { staffs: staffs.map { |s| StaffSerializer.new(s).as_json } }
  end

  def create
    staff = current_shop.staffs.build(staff_params)

    if staff.save
      render json: { staff: StaffSerializer.new(staff).as_json }, status: :created
    else
      render json: { errors: staff.errors.full_messages }, status: :unprocessable_content
    end
  end

  def destroy
    staff = current_shop.staffs.find(params[:id])

    if staff.id == current_staff.id
      return render json: { error: 'Cannot delete your own account' }, status: :unprocessable_content
    end

    staff.destroy
    render json: { message: 'Staff deleted successfully' }
  end

  private

  def staff_params
    params.require(:staff).permit(:name, :username, :password, :role)
  end
end
