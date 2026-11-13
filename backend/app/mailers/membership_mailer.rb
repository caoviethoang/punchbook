# frozen_string_literal: true

class MembershipMailer < ApplicationMailer
  def welcome_email(membership)
    @membership = membership
    @shop = membership.shop
    @package = membership.package

    mail(
      to: @membership.email,
      subject: "[#{@shop.name}] Chào mừng bạn gia nhập - Thông tin thẻ tập"
    )
  end

  def check_in_receipt_email(check_in)
    @check_in = check_in
    @membership = check_in.membership
    @shop = @membership.shop
    @package = @membership.package

    mail(
      to: @membership.email,
      subject: "[#{@shop.name}] Phiếu xác nhận điểm danh #{I18n.l(@check_in.checked_in_at, format: :short)}"
    )
  end

  def payment_receipt_email(invoice)
    @invoice = invoice
    @membership = invoice.membership
    @shop = @membership&.shop
    @package = @membership&.package

    mail(
      to: @membership.email,
      subject: "[#{@shop.name}] Hóa đơn thanh toán ##{@invoice.id.to_s[0..7]}"
    )
  end

  def expiring_reminder_email(membership, payment_url: nil)
    @membership = membership
    @shop = membership.shop
    @package = membership.package
    @payment_url = payment_url

    mail(
      to: @membership.email,
      subject: "[#{@shop.name}] Nhắc nhở: Thẻ tập của bạn sắp hết hạn"
    )
  end

  def reengagement_email(membership, custom_message: nil)
    @membership = membership
    @shop = membership.shop
    @package = membership.package
    @custom_message = custom_message

    mail(
      to: @membership.email,
      subject: "[#{@shop.name}] Chúng tôi nhớ bạn! Quay lại tập luyện nhé"
    )
  end
end
