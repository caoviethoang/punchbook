# frozen_string_literal: true

class AddChurnRiskToMemberships < ActiveRecord::Migration[8.1]
  def change
    add_column :memberships, :churn_risk_level, :string
    add_column :memberships, :churn_risk_scored_at, :datetime
    add_column :memberships, :last_reengagement_sent_at, :datetime
    add_index :memberships, %i[shop_id churn_risk_level]
  end
end
