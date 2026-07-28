# frozen_string_literal: true

def seed_shop(index)
  shop = Shop.create!(
    name: "TallyPass Studio #{index + 1}",
    phone: "090123456#{index}"
  )

  staff1 = shop.staffs.create!(name: 'Nguyễn Văn A', role: 'Manager')
  staff2 = shop.staffs.create!(name: 'Trần Thị B', role: 'Trainer')

  package_basic = shop.packages.create!(name: 'Gói Cơ Bản (10 Buổi)', sessions_count: 10, price: 1_000_000)
  package_pro   = shop.packages.create!(name: 'Gói Pro (30 Buổi)',    sessions_count: 30, price: 2_500_000)

  membership1 = Membership.create!(shop: shop, package: package_basic, customer_name: 'Lê Văn C',
                                   phone: '0987654321', sessions_left: 8, expires_at: 3.months.from_now)
  membership2 = Membership.create!(shop: shop, package: package_pro, customer_name: 'Phạm Thị D',
                                   phone: '0977654321', sessions_left: 30, expires_at: 6.months.from_now)

  CheckIn.create!(membership: membership1, staff: staff2, checked_in_at: 2.days.ago)
  CheckIn.create!(membership: membership1, staff: staff1, checked_in_at: Time.current)

  Invoice.create!(membership: membership1, amount: package_basic.price, status: 'PAID',
                  payos_transaction_id: "PAYOS_#{SecureRandom.hex(6).upcase}")
  Invoice.create!(membership: membership2, amount: package_pro.price, status: 'PENDING',
                  payos_transaction_id: nil)
end

Rails.logger.debug 'Xóa dữ liệu cũ...'
Invoice.destroy_all
CheckIn.destroy_all
Membership.destroy_all
Package.destroy_all
Staff.destroy_all
Shop.destroy_all

Rails.logger.debug 'Đang tạo dữ liệu mẫu cho TallyPass...'

2.times { |i| seed_shop(i) }

Rails.logger.debug 'Seed database thành công! Đã tạo Shops, Staffs, Packages, Memberships, CheckIns và Invoices.'
