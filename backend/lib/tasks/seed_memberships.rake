# frozen_string_literal: true

namespace :memberships do
  desc 'Seed random memberships for shops (usage: rails memberships:seed[50,email@example.com])'
  task :seed, %i[count email] => :environment do |_t, args|
    count = (args[:count] || 50).to_i
    shops = args[:email].present? ? Shop.where(email: args[:email]) : Shop.all

    if shops.empty?
      puts "No shops found matching #{args[:email].inspect}."
      next
    end

    shops.each do |shop|
      puts "--> Seeding #{count} memberships for shop: #{shop.name} (#{shop.email})..."
      created = SeedMembershipsService.call(shop: shop, count: count)
      puts "    Done! Created #{created.size} memberships. Shop now has #{shop.memberships.count} total memberships."
    end
  end
end
