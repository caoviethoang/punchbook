# frozen_string_literal: true

Rails.application.routes.draw do
  post '/graphql', to: 'graphql#execute'

  post '/auth/register', to: 'auth#register'
  post '/auth/login', to: 'auth#login'
  get '/auth/me', to: 'auth#me'

  get '/dashboard', to: 'dashboard#show'
  get '/reports/export', to: 'reports#export'

  resources :packages, only: %i[index create]

  resources :memberships, only: %i[index create show] do
    collection do
      get :import_template
      post :import
    end
    member do
      post :check_in
    end
    resources :invoices, only: %i[create]
  end

  namespace :webhooks do
    post :payos, to: 'payos#create'
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get 'up' => 'rails/health#show', as: :rails_health_check
end
