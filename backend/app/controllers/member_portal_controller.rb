# frozen_string_literal: true

# Public token-authenticated self-service portal for gym members.
# Strictly scoped to the single Membership matching the provided public_token.
class MemberPortalController < ApplicationController
  before_action :authenticate_member!

  rescue_from ActiveRecord::RecordNotFound do
    render_error(I18n.t('errors.not_found', default: 'Membership not found'), code: 'NOT_FOUND', status: :not_found)
  end

  rescue_from PayosService::Error do |exception|
    render_error(exception.message, code: 'PAYMENT_ERROR', status: :unprocessable_content)
  end

  def profile
    render json: {
      member: member_profile_payload,
      available_packages: available_packages_payload
    }
  end

  def history
    check_ins = @membership.check_ins.order(checked_in_at: :desc).limit(50)
    invoices = @membership.invoices.order(created_at: :desc).limit(30)

    render json: {
      check_ins: check_ins.map { |ci| { id: ci.id, checked_in_at: ci.checked_in_at&.iso8601 } },
      invoices: invoices.map { |inv| serialize_invoice(inv) }
    }
  end

  def renew
    target_package = resolve_renewal_package
    invoice, payos = create_portal_invoice(target_package)

    render json: {
      invoice: invoice.as_api_json,
      payos: { checkout_url: payos&.checkout_url, qr_code: payos&.qr_code }
    }, status: :created
  end

  private

  def authenticate_member!
    token = extract_member_token
    if token.blank?
      return render_error(
        I18n.t('errors.unauthorized', default: 'Member token is required'),
        code: 'UNAUTHORIZED',
        status: :unauthorized
      )
    end

    @membership = Membership.includes(:package, :shop, :assigned_staff).find_by!(public_token: token)
  end

  def extract_member_token
    request.headers['X-Member-Token'].presence ||
      bearer_token.presence ||
      params[:token].presence
  end

  def resolve_renewal_package
    return @membership.package if params[:package_id].blank?

    @membership.shop.packages.find(params.expect(:package_id))
  end

  def create_portal_invoice(target_package)
    CreateInvoice.call(
      shop: @membership.shop,
      membership_id: @membership.id,
      params: { amount: target_package.price, description: 'Gia han' }
    )
  rescue PayosService::Error => e
    raise e if ENV['PAYOS_CLIENT_ID'].present? || !shop_bank_configured?

    invoice = @membership.invoices.create!(amount: target_package.price || 0, status: 'pending')
    [invoice, nil]
  end

  def shop_bank_configured?
    @membership.shop.bank_name.present? && @membership.shop.bank_account_no.present?
  end

  def member_profile_payload
    @membership.as_api_json.merge('shop' => portal_shop_payload)
  end

  def portal_shop_payload
    shop = @membership.shop
    {
      id: shop.id, name: shop.name, phone: shop.phone, address: shop.address,
      bank_name: shop.bank_name, bank_account_no: shop.bank_account_no,
      bank_account_name: shop.bank_account_name
    }
  end

  def available_packages_payload
    @membership.shop.packages.order(:price).map do |pkg|
      {
        id: pkg.id, name: pkg.name, price: pkg.price,
        sessions_count: pkg.sessions_count, duration_days: pkg.duration_days
      }
    end
  end

  def serialize_invoice(invoice)
    {
      id: invoice.id, amount: invoice.amount, status: invoice.status,
      payos_order_code: invoice.payos_order_code,
      payos_checkout_url: invoice.payos_checkout_url,
      created_at: invoice.created_at&.iso8601
    }
  end
end
