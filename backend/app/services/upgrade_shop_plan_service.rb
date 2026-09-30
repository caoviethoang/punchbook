# frozen_string_literal: true

class UpgradeShopPlanService
  MONTHLY_PRICE = 199_000

  Result = Struct.new(:success?, :shop, :payment, :checkout_url, :qr_code, :errors, keyword_init: true)

  def initialize(shop, months: 1)
    @shop = shop
    @months = months.to_i
  end

  def call
    return Result.new(success?: false, errors: ['Số tháng nâng cấp không hợp lệ']) if @months <= 0

    amount = @months * MONTHLY_PRICE
    payment = @shop.shop_plan_payments.build(amount: amount, months: @months, status: 'pending')

    return Result.new(success?: false, errors: payment.errors.full_messages) unless payment.save

    if payos_configured?
      create_payos_payment(payment)
    else
      execute_direct_upgrade(payment)
    end
  end

  private

  def payos_configured?
    ENV['PAYOS_CLIENT_ID'].present? && ENV['PAYOS_API_KEY'].present?
  end

  def create_payos_payment(payment)
    payos = call_payos_api(payment)
    payment.update!(payos_transaction_id: payos.payment_link_id, payos_checkout_url: payos.checkout_url)
    Result.new(success?: true, shop: @shop, payment: payment, checkout_url: payos.checkout_url, qr_code: payos.qr_code)
  rescue PayosService::Error => e
    Result.new(success?: false, errors: [e.message])
  end

  def call_payos_api(payment)
    PayosService.create_payment_link(
      order_code: payment.payos_order_code, amount: payment.amount, description: 'Nang cap PunchBook',
      cancel_url: "#{app_host}/settings?status=cancel", return_url: "#{app_host}/settings?status=success"
    )
  end

  def execute_direct_upgrade(payment)
    base_time = @shop.plan_expires_at && @shop.plan_expires_at > Time.current ? @shop.plan_expires_at : Time.current

    Shop.transaction do
      payment.update!(status: 'paid')
      @shop.update!(plan: 'paid', plan_expires_at: base_time + @months.months)
    end

    Result.new(success?: true, shop: @shop, payment: payment)
  end

  def app_host
    ENV.fetch('FRONTEND_URL', 'http://localhost:5173')
  end
end
