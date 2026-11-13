# frozen_string_literal: true

Rails.application.routes.draw do
  concern :api_v1_endpoints do
    post '/graphql', to: 'graphql#execute'

    post '/auth/register', to: 'auth#register'
    post '/auth/login', to: 'auth#login'
    get '/auth/me', to: 'auth#me'

    get '/member_portal/profile', to: 'member_portal#profile'
    get '/member_portal/history', to: 'member_portal#history'
    post '/member_portal/renew', to: 'member_portal#renew'

    get '/dashboard', to: 'dashboard#show'
    get '/reports/export', to: 'reports#export'
    get '/reports/attendance', to: 'reports#attendance'
    get '/reports/attendance/export', to: 'reports#export_attendance'
    get '/reports/churn_risk', to: 'reports#churn_risk'
    get '/reports/trainer_commissions', to: 'reports#trainer_commissions'
    get '/reports/trainer_commissions/export', to: 'reports#export_trainer_commissions'

    get '/settings', to: 'settings#show'
    patch '/settings/profile', to: 'settings#update_profile'
    patch '/settings/password', to: 'settings#update_password'
    post '/settings/upgrade_plan', to: 'settings#upgrade_plan'
    post '/settings/regenerate_device_api_key', to: 'settings#regenerate_device_api_key'

    post '/hardware/check_in', to: 'hardware_check_ins#create'

    resources :class_types, only: %i[index show create update destroy]
    resources :class_schedules, only: %i[index show create update destroy] do
      member do
        post :book
        post :cancel_booking
        post :check_in_member
      end
    end

    resources :package_categories, only: %i[index create update destroy]
    resources :packages, only: %i[index create update destroy]
    resources :staffs, only: %i[index create destroy] do
      get :trainers, on: :collection
    end
    resources :memberships, only: %i[index create show update destroy] do
      collection do
        get :export
        get :import_template
        post :import
      end
      member do
        post :check_in
        post :restore
        post :freeze
        post :unfreeze
        post :transfer
        post :send_reengagement
      end
      resources :invoices, only: %i[create]
    end

    post '/memberships/batch_check_in', to: 'batch_check_ins#create'
    post '/memberships/:id/renew', to: 'membership_renewals#create'

    resources :audit_logs, only: [:index]
    resources :notification_logs, only: [:index] do
      post :test, on: :collection
    end
    resources :webhook_events, only: [:index] do
      post :retry, on: :member
    end

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
