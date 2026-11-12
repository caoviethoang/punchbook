# frozen_string_literal: true

# Computes closed PT sales and sales commissions per trainer for a given date range.
# Prevents double-counting by prioritizing paid invoices and falling back to un-invoiced memberships.
class TrainerSalesSummaryQuery
  def self.call(shop:, trainer_ids:, month_range:)
    new(shop: shop, trainer_ids: trainer_ids, month_range: month_range).call
  end

  def initialize(shop:, trainer_ids:, month_range:)
    @shop = shop
    @trainer_ids = trainer_ids
    @month_range = month_range
  end

  def call
    grouped = Hash.new { |h, k| h[k] = { count: 0, amount: 0, commission: 0 } }
    return grouped if trainer_ids.empty?

    invoices = fetch_month_invoices
    accumulate_invoices(grouped, invoices)
    accumulate_memberships(grouped, invoices.map(&:membership_id).uniq)
    grouped
  end

  private

  attr_reader :shop, :trainer_ids, :month_range

  def accumulate_invoices(grouped, invoices)
    invoices.each do |inv|
      record_sale(grouped, inv.membership.assigned_staff_id, inv.amount, inv.membership.package)
    end
  end

  def accumulate_memberships(grouped, invoiced_ids)
    fetch_un_invoiced_memberships(invoiced_ids).each do |membership|
      record_sale(grouped, membership.assigned_staff_id, membership.package.price, membership.package)
    end
  end

  def record_sale(grouped, staff_id, raw_amount, package)
    amount = raw_amount.to_i
    entry = grouped[staff_id]
    entry[:count] += 1
    entry[:amount] += amount
    entry[:commission] += package.calculate_sale_commission(amount)
  end

  def fetch_month_invoices
    Invoice.joins(:membership).includes(membership: :package)
           .where(memberships: { shop_id: shop.id, assigned_staff_id: trainer_ids },
                  status: 'paid', created_at: month_range)
           .to_a
  end

  def fetch_un_invoiced_memberships(excluded_ids)
    scope = shop.memberships.includes(:package).where(assigned_staff_id: trainer_ids, created_at: month_range)
    excluded_ids.any? ? scope.where.not(id: excluded_ids).to_a : scope.to_a
  end
end
