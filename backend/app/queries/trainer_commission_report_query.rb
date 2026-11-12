# frozen_string_literal: true

# Aggregates monthly Personal Trainer (PT) session check-ins, sales closed,
# and calculated commissions for a shop (optionally filtered by trainer).
class TrainerCommissionReportQuery
  SUMMARY_KEYS = %i[
    sessions_completed sales_count sales_amount session_commission sale_commission
  ].freeze

  def self.call(shop, month_str = nil, trainer_id: nil)
    new(shop, month_str, trainer_id: trainer_id).to_h
  end

  def initialize(shop, month_str = nil, trainer_id: nil)
    @shop = shop
    @month_str = month_str.to_s.strip
    @filter_trainer_id = trainer_id.presence
  end

  def to_h
    {
      month: target_date.strftime('%Y-%m'), start_date: month_range.begin.to_date.to_s,
      end_date: month_range.end.to_date.to_s, summary: build_summary,
      trainers: trainer_rows, sessions: session_rows
    }
  end

  private

  attr_reader :shop, :month_str, :filter_trainer_id

  def target_date
    @target_date ||= month_str.match?(/\A\d{4}-\d{2}\z/) ? Date.strptime(month_str, '%Y-%m') : Time.zone.today
  rescue ArgumentError
    Time.zone.today
  end

  def month_range
    @month_range ||= target_date.in_time_zone.all_month
  end

  def trainers
    @trainers ||= shop.staffs.where(id: filter_trainer_id || active_trainer_ids).order(:name).to_a
  end

  def active_trainer_ids
    role_ids = shop.staffs.where(role: 'trainer').pluck(:id)
    checkin_ids = month_check_ins_scope.distinct.pluck(:trainer_id).compact
    assigned_ids = shop.memberships.where.not(assigned_staff_id: nil).distinct.pluck(:assigned_staff_id)
    role_ids | checkin_ids | assigned_ids
  end

  def trainer_ids
    @trainer_ids ||= trainers.map(&:id)
  end

  def month_check_ins_scope
    CheckIn.joins(:membership).where(memberships: { shop_id: shop.id }, checked_in_at: month_range)
  end

  def check_ins
    @check_ins ||= trainer_ids.empty? ? [] : load_check_ins
  end

  def load_check_ins
    month_check_ins_scope.where(trainer_id: trainer_ids).includes(:trainer, membership: :package)
                         .order(checked_in_at: :desc).to_a
  end

  def sales_by_trainer
    @sales_by_trainer ||= TrainerSalesSummaryQuery.call(shop: shop, trainer_ids: trainer_ids, month_range: month_range)
  end

  def assigned_clients_counts
    @assigned_clients_counts ||= if trainer_ids.empty?
                                   {}
                                 else
                                   shop.memberships.where(assigned_staff_id: trainer_ids)
                                       .where.not(status: 'expired').group(:assigned_staff_id).count
                                 end
  end

  def trainer_rows
    grouped = check_ins.group_by(&:trainer_id)
    @trainer_rows ||= trainers.map { |trainer| build_trainer_row(trainer, grouped[trainer.id] || []) }
  end

  def build_trainer_row(trainer, sessions)
    session_comm = sessions.sum { |ci| ci.membership.package.calculate_session_commission }
    sales = sales_by_trainer[trainer.id]
    total_comm = session_comm + sales[:commission]
    trainer_attributes(trainer).merge(
      sessions_completed: sessions.size, session_commission: session_comm,
      sales_count: sales[:count], sales_amount: sales[:amount], sale_commission: sales[:commission],
      total_commission: total_comm, payout_status: total_comm.positive? ? 'pending' : 'settled'
    )
  end

  def trainer_attributes(trainer)
    {
      trainer_id: trainer.id, trainer_name: trainer.name, trainer_role: trainer.role,
      assigned_clients_count: assigned_clients_counts[trainer.id] || 0
    }
  end

  def session_rows
    @session_rows ||= check_ins.map { |ci| build_session_row(ci) }
  end

  def build_session_row(check_in)
    package = check_in.membership.package
    {
      check_in_id: check_in.id, membership_id: check_in.membership_id,
      customer_name: check_in.membership.customer_name, package_name: package.name,
      trainer_id: check_in.trainer_id, trainer_name: check_in.trainer&.name,
      checked_in_at: check_in.checked_in_at&.iso8601, commission_amount: package.calculate_session_commission
    }
  end

  def build_summary
    summary = SUMMARY_KEYS.each_with_object(total_trainers: trainer_rows.size) do |key, acc|
      acc[:"total_#{key}"] = trainer_rows.sum { |row| row[key] }
    end
    summary.merge(total_commission: summary[:total_session_commission] + summary[:total_sale_commission])
  end
end
