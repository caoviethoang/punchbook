# frozen_string_literal: true

module Types
  class HelloType < Types::BaseObject
    field :message, String, null: false, description: 'The hello message text'
  end
end
