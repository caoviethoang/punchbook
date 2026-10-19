# frozen_string_literal: true

# Service to generate random sample memberships for testing and demonstration.
class SeedMembershipsService
  FIRST_NAMES = %w[Nguyễn Trần Lê Phạm Hoàng Huỳnh Phan Vũ Võ Đặng Bùi Đỗ Hồ Ngô Dương Lý Mai Đinh].freeze
  MIDDLE_NAMES = %w[Văn Thị Minh Đức Hoàng Anh Hải Ngọc Tuấn Phương Quốc Thanh Hữu Khánh Nhật].freeze
  LAST_NAMES = %w[An Bình Cường Dũng Đạt Giang Hà Hiếu Huy Hùng Khoa Linh Long Mai Nam Nhân Phong].freeze
  PHONE_PREFIXES = %w[090 091 093 094 097 098 086 088 089 070 076 077 078 079 032 033 038 039].freeze

  def self.call(shop:, count: 50)
    new(shop: shop, count: count).call
  end

  def initialize(shop:, count: 50)
    @shop = shop
    @count = count
    @existing_names = shop.memberships.pluck(:customer_name).to_set
    @existing_phones = shop.memberships.pluck(:phone).to_set
  end

  def call
    ensure_shop_prerequisites!
    packages = shop.packages.to_a
    created = []

    count.times do
      pkg = packages.sample
      membership = build_random_membership(pkg)
      membership.save!
      created << membership
    end

    created
  end

  private

  attr_reader :shop, :count, :existing_names, :existing_phones

  def ensure_shop_prerequisites!
    shop.update!(plan: 'paid') if shop.plan != 'paid'
    ensure_session_packages!
    ensure_day_packages!
  end

  def ensure_session_packages!
    return if shop.packages.any?(&:session_based?)

    shop.packages.create!(name: 'Gói 10 buổi PT', sessions_count: 10, price: 1_200_000)
    shop.packages.create!(name: 'Gói 30 buổi PT', sessions_count: 30, price: 3_000_000)
  end

  def ensure_day_packages!
    return if shop.packages.any?(&:day_based?)

    shop.packages.create!(name: 'Gói Tháng (30 ngày)', duration_days: 30, price: 800_000)
  end

  def build_random_membership(package)
    membership = shop.memberships.build(
      customer_name: generate_unique_name,
      phone: generate_unique_phone,
      package: package
    )
    assign_membership_schedule!(membership, package)
    membership
  end

  def assign_membership_schedule!(membership, package)
    roll = rand
    if package.session_based?
      membership.sessions_left = calculate_sessions_left(package.sessions_count, roll)
      membership.expires_at = nil
    else
      membership.sessions_left = nil
      membership.expires_at = calculate_expires_at(roll)
    end
  end

  def calculate_sessions_left(total, roll)
    if roll < 0.65
      rand([4, total].min..total)
    elsif roll < 0.85
      rand(1..[3, total].min)
    else
      0
    end
  end

  def calculate_expires_at(roll)
    if roll < 0.65
      rand(10..60).days.from_now.to_date
    elsif roll < 0.85
      rand(1..6).days.from_now.to_date
    else
      rand(1..15).days.ago.to_date
    end
  end

  def generate_unique_name
    loop do
      candidate = "#{FIRST_NAMES.sample} #{MIDDLE_NAMES.sample} #{LAST_NAMES.sample}"
      unless existing_names.include?(candidate)
        existing_names << candidate
        return candidate
      end
    end
  end

  def generate_unique_phone
    loop do
      candidate = "#{PHONE_PREFIXES.sample}#{rand(1_000_000..9_999_999)}"
      unless existing_phones.include?(candidate)
        existing_phones << candidate
        return candidate
      end
    end
  end
end
