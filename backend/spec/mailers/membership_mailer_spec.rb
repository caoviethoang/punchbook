# frozen_string_literal: true

require 'rails_helper'

RSpec.describe MembershipMailer, type: :mailer do
  let(:shop) { create_shop(name: 'Fitness Plus', email: 'owner@fit.vn', phone: '0901234567') }
  let(:package) { Package.create!(shop: shop, name: 'Gói 10 buổi', sessions_count: 10, price: 500_000) }
  let(:membership) do
    Membership.create!(
      shop: shop,
      package: package,
      customer_name: 'Nguyen Van A',
      phone: '0912345678',
      email: 'member@example.com',
      sessions_left: 8
    )
  end

  describe '#welcome_email' do
    let(:mail) { described_class.welcome_email(membership) }

    it 'renders the headers and recipient' do
      expect(mail.to).to eq(['member@example.com'])
      expect(mail.subject).to include('Fitness Plus')
      expect(mail.subject).to include('Chào mừng bạn gia nhập')
    end

    it 'renders the body with member and package details' do
      decoded = mail.html_part.body.decoded
      expect(decoded).to include('Nguyen Van A')
      expect(decoded).to include('Gói 10 buổi')
      expect(decoded).to include('0912345678')
    end
  end

  describe '#check_in_receipt_email' do
    let(:check_in) { CheckIn.create!(membership: membership, checked_in_at: Time.current) }
    let(:mail) { described_class.check_in_receipt_email(check_in) }

    it 'renders check-in confirmation headers and remaining sessions' do
      expect(mail.to).to eq(['member@example.com'])
      expect(mail.subject).to include('Phiếu xác nhận điểm danh')
      decoded = mail.html_part.body.decoded
      expect(decoded).to include('Nguyen Van A')
      expect(decoded).to include('8 buổi')
    end
  end

  describe '#payment_receipt_email' do
    let(:invoice) { Invoice.create!(membership: membership, amount: 500_000, status: 'paid') }
    let(:mail) { described_class.payment_receipt_email(invoice) }

    it 'renders payment receipt with invoice amount and status' do
      expect(mail.to).to eq(['member@example.com'])
      expect(mail.subject).to include('Hóa đơn thanh toán')
      decoded = mail.html_part.body.decoded
      expect(decoded).to include('500,000')
      expect(decoded).to include('Đã thanh toán')
    end
  end

  describe '#expiring_reminder_email' do
    let(:mail) { described_class.expiring_reminder_email(membership, payment_url: 'https://pay.example.com/checkout') }

    it 'renders expiration reminder with renewal link' do
      expect(mail.to).to eq(['member@example.com'])
      expect(mail.subject).to include('sắp hết hạn')
      decoded = mail.html_part.body.decoded
      expect(decoded).to include('https://pay.example.com/checkout')
      expect(decoded).to include('8 buổi')
    end
  end
end
