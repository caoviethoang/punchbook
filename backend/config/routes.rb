# frozen_string_literal: true

Rails.application.routes.draw do
  post '/graphql', to: 'graphql#execute'

  post '/auth/register', to: 'auth#register'
  post '/auth/login', to: 'auth#login'
  get '/auth/me', to: 'auth#me'

  get '/dashboard', to: 'dashboard#show'
  get '/reports/export', to: 'reports#export'

  get '/settings', to: 'settings#show'
  patch '/settings/profile', to: 'settings#update_profile'
  patch '/settings/password', to: 'settings#update_password'
  post '/settings/upgrade_plan', to: 'settings#upgrade_plan'

  resources :package_categories, only: %i[index create update destroy]
  resources :packages, only: %i[index create update destroy]
  resources :staffs, only: %i[index create destroy]

  resources :memberships, only: %i[index create show update destroy] do
    collection do
      get :export
      get :import_template
      post :import
    end
    member do
      post :check_in
      post :restore
    end
    resources :invoices, only: %i[create]
  end

  post '/memberships/batch_check_in', to: 'batch_check_ins#create'
  post '/memberships/:id/renew', to: 'membership_renewals#create'

  resources :audit_logs, only: [:index]
  resources :webhook_events, only: [:index] do
    post :retry, on: :member
  end

  namespace :webhooks do
    post :payos, to: 'payos#create'
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get 'up' => 'rails/health#show', as: :rails_health_check
end
