# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DailyMembershipStatusUpdateJob, type: :job do
  describe '#perform' do
    it 'delegates to UpdateDailyMembershipStatuses' do
      allow(UpdateDailyMembershipStatuses).to receive(:call)

      described_class.new.perform

      expect(UpdateDailyMembershipStatuses).to have_received(:call)
    end
  end
end
