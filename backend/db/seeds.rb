# frozen_string_literal: true

def create_staffs(shop)
  staff1 = shop.staffs.create!(name: 'Nguyễn Văn A', role: 'Manager')
  staff2 = shop.staffs.create!(name: 'Trần Thị B', role: 'Trainer')
  [staff1, staff2]
end

def create_packages(shop)
  basic = shop.packages.create!(name: 'Gói Cơ Bản (10 Buổi)', sessions_count: 10, price: 1_000_000)
  pro   = shop.packages.create!(name: 'Gói Pro (30 Buổi)',    sessions_count: 30, price: 2_500_000)
  month = shop.packages.create!(name: 'Gói Tháng (30 Ngày)', duration_days: 30, price: 800_000)
  [basic, pro, month]
end

def create_memberships(shop, package_basic, package_pro, package_month = nil)
  members = [
    Membership.create!(shop: shop, package: package_basic, customer_name: 'Lê Văn C',
                       phone: '0987654321', sessions_left: 8, expires_at: 3.months.from_now),
    Membership.create!(shop: shop, package: package_pro, customer_name: 'Phạm Thị D',
                       phone: '0977654321', sessions_left: 30, expires_at: 6.months.from_now)
  ]
  members << create_day_membership(shop, package_month) if package_month
  members
end

def create_day_membership(shop, package)
  Membership.create!(
    shop: shop,
    package: package,
    customer_name: 'Hoàng Văn E',
    phone: '0967654321',
    sessions_left: nil,
    expires_at: 30.days.from_now.to_date
  )
end

def seed_check_ins_and_invoices(memberships, staffs, packages)
  m1, m2 = memberships
  staff1, staff2 = staffs
  package_basic, package_pro = packages

  CheckIn.create!(membership: m1, staff: staff2, checked_in_at: 2.days.ago)
  CheckIn.create!(membership: m1, staff: staff1, checked_in_at: Time.current)

  Invoice.create!(membership: m1, amount: package_basic.price, status: 'PAID',
                  payos_transaction_id: "PAYOS_#{SecureRandom.hex(6).upcase}")
  Invoice.create!(membership: m2, amount: package_pro.price, status: 'PENDING', payos_transaction_id: nil)
end

def seed_shop(index)
  # Shop đầu free (mặc định), shop thứ hai paid để demo giới hạn / Zalo sau này
  plan = index.zero? ? 'free' : 'paid'
  shop = Shop.create!(name: "TallyPass Studio #{index + 1}", phone: "090123456#{index}", plan: plan)
  staffs   = create_staffs(shop)
  packages = create_packages(shop)
  members  = create_memberships(shop, packages[0], packages[1], packages[2])
  seed_check_ins_and_invoices(members, staffs, packages)
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
