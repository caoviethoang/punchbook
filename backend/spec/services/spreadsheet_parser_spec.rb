# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SpreadsheetParser do
  describe '.format_phone' do
    it 'adds leading 0 for 9-digit phones' do
      expect(described_class.format_phone('901234567')).to eq('0901234567')
    end

    it 'removes .0 suffix from float string representation' do
      expect(described_class.format_phone('901234567.0')).to eq('0901234567')
    end

    it 'keeps 10-digit phones as-is' do
      expect(described_class.format_phone('0901234567')).to eq('0901234567')
    end
  end

  describe '.parse_date' do
    it 'parses date in d/m/Y format' do
      parsed = described_class.parse_date('15/10/2026')
      expect(parsed).to eq(Date.new(2026, 10, 15))
    end

    it 'handles date objects' do
      date = Date.new(2026, 10, 15)
      expect(described_class.parse_date(date)).to eq(date)
    end

    it 'returns nil for invalid date string' do
      expect(described_class.parse_date('invalid')).to be_nil
    end
  end

  describe '.find_column_indexes' do
    it 'maps header row correctly' do
      headers = ['Họ và Tên', 'SĐT', 'Gói tập', 'Số buổi']
      indexes = described_class.find_column_indexes(headers)
      expect(indexes).to eq([0, 1, 2, 3])
    end
  end
end
