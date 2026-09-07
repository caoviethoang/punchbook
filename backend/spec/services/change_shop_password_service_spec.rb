# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ChangeShopPasswordService do
  let(:shop) { create_shop(password: 'oldpassword123', password_confirmation: 'oldpassword123') }

  describe '#call' do
    it 'changes password successfully when current_password is correct and new password is valid' do
      service = described_class.new(
        shop,
        { current_password: 'oldpassword123', password: 'newpassword456', password_confirmation: 'newpassword456' }
      )
      result = service.call

      expect(result.success?).to be true
      expect(shop.reload.valid_password?('newpassword456')).to be true
    end

    it 'fails when current_password is blank' do
      service = described_class.new(
        shop,
        { current_password: '', password: 'newpassword456', password_confirmation: 'newpassword456' }
      )
      result = service.call

      expect(result.success?).to be false
      expect(result.errors).to include('Mật khẩu hiện tại không được để trống')
    end

    it 'fails when current_password is incorrect' do
      service = described_class.new(
        shop,
        { current_password: 'wrongpassword', password: 'newpassword456', password_confirmation: 'newpassword456' }
      )
      result = service.call

      expect(result.success?).to be false
      expect(result.errors).to include('Mật khẩu hiện tại không đúng')
    end

    it 'fails when new password and password confirmation do not match' do
      service = described_class.new(
        shop,
        { current_password: 'oldpassword123', password: 'newpassword456', password_confirmation: 'mismatch' }
      )
      result = service.call

      expect(result.success?).to be false
      expect(result.errors).to include("Password confirmation doesn't match Password")
    end
  end
end
