# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'GraphQL API', type: :request do
  describe 'hello query' do
    it 'returns the hello message on /api/v1/graphql' do
      post '/api/v1/graphql', params: { query: '{ hello { message } }' }

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json.dig('data', 'hello', 'message')).to eq('Hello PunchBook')
    end

    it 'returns the hello message on fallback /graphql' do
      post '/graphql', params: { query: '{ hello { message } }' }

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json.dig('data', 'hello', 'message')).to eq('Hello PunchBook')
    end
  end
end
