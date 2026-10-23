# frozen_string_literal: true

Rails.application.routes.draw do
  concern :api_v1_endpoints do
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

    resources :audit_logs, only: [:index]

    namespace :webhooks do
      post :payos, to: 'payos#create'
    end
  end

  scope '/api/v1' do
    concerns :api_v1_endpoints
  end

  # Root aliases for backward compatibility and webhook receivers
  concerns :api_v1_endpoints

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  get 'up' => 'rails/health#show', as: :rails_health_check
end
