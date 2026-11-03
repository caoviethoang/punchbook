# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'ClassSchedules API', type: :request do
  let!(:shop) { create_shop(name: 'Yoga Hub', phone: '0901112222') }
  let!(:coach) do
    Staff.create!(shop: shop, name: 'Instructor Linh', username: 'linh1', password: 'password123', role: 'staff')
  end
  let!(:yoga) do
    ClassType.create!(
      shop: shop, name: 'Yoga Flow', color: '#6366f1',
      default_capacity: 10, default_duration_minutes: 60
    )
  end
  let!(:session_pkg) { Package.create!(shop: shop, name: '10 Sessions', sessions_count: 10, price: 1_000_000) }
  let!(:member1) do
    Membership.create!(
      shop: shop, package: session_pkg, customer_name: 'Nguyen Van A',
      phone: '0901111111', sessions_left: 5, expires_at: Date.current + 30.days
    )
  end
  let!(:member2) do
    Membership.create!(
      shop: shop, package: session_pkg, customer_name: 'Tran Thi B',
      phone: '0902222222', sessions_left: 3, expires_at: Date.current + 30.days
    )
  end

  let!(:schedule) do
    ClassSchedule.create!(
      shop: shop, class_type: yoga, instructor: coach,
      starts_at: 2.hours.from_now, ends_at: 3.hours.from_now,
      max_capacity: 1, status: 'scheduled', credit_policy: 'booking', cancellation_hours: 1
    )
  end

  describe 'GET /api/v1/class_schedules' do
    it 'returns schedules within the date range' do
      get '/api/v1/class_schedules',
          params: { from: 1.hour.from_now.iso8601, to: 4.hours.from_now.iso8601 },
          headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body['class_schedules'].size).to eq(1)
      expect(body['class_schedules'].first['id']).to eq(schedule.id)
    end

    it 'returns 422 for invalid date range' do
      get '/api/v1/class_schedules',
          params: { from: 4.hours.from_now.iso8601, to: 1.hour.from_now.iso8601 },
          headers: auth_headers(shop)

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'POST /api/v1/class_schedules' do
    it 'creates a new single schedule' do
      params = {
        class_schedule: {
          class_type_id: yoga.id,
          instructor_id: coach.id,
          starts_at: 1.day.from_now.change(hour: 8, min: 0).iso8601,
          ends_at: 1.day.from_now.change(hour: 9, min: 0).iso8601,
          max_capacity: 15,
          status: 'scheduled',
          credit_policy: 'attendance',
          cancellation_hours: 2
        }
      }

      post '/api/v1/class_schedules', params: params, headers: auth_headers(shop)
      expect(response).to have_http_status(:created)
      expect(response.parsed_body['class_schedules'].first['max_capacity']).to eq(15)
    end
  end

  describe 'POST /api/v1/class_schedules/:id/book and /cancel_booking' do
    it 'books the first member and waitlists the second member when capacity is 1' do
      post "/api/v1/class_schedules/#{schedule.id}/book",
           params: { membership_id: member1.id },
           headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      roster = response.parsed_body.dig('class_schedule', 'bookings')
      first_booking = roster.find { |b| b['membership_id'] == member1.id }
      expect(first_booking['status']).to eq('booked')
      expect(member1.reload.sessions_left).to eq(4) # deducted because credit_policy is 'booking'

      post "/api/v1/class_schedules/#{schedule.id}/book",
           params: { membership_id: member2.id },
           headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      roster = response.parsed_body.dig('class_schedule', 'bookings')
      second_booking = roster.find { |b| b['membership_id'] == member2.id }
      expect(second_booking['status']).to eq('waitlisted')
      expect(member2.reload.sessions_left).to eq(3) # not deducted while waitlisted
    end

    it 'promotes the waitlisted member when the booked member cancels' do
      # Book member 1
      post "/api/v1/class_schedules/#{schedule.id}/book",
           params: { membership_id: member1.id },
           headers: auth_headers(shop)
      # Waitlist member 2
      post "/api/v1/class_schedules/#{schedule.id}/book",
           params: { membership_id: member2.id },
           headers: auth_headers(shop)

      # Cancel member 1
      post "/api/v1/class_schedules/#{schedule.id}/cancel_booking",
           params: { membership_id: member1.id },
           headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(member1.reload.sessions_left).to eq(5) # refunded

      roster = response.parsed_body.dig('class_schedule', 'bookings')
      b1 = roster.find { |b| b['membership_id'] == member1.id }
      b2 = roster.find { |b| b['membership_id'] == member2.id }
      expect(b1['status']).to eq('cancelled')
      expect(b2['status']).to eq('booked')
      expect(member2.reload.sessions_left).to eq(2) # deducted on promotion
    end
  end

  describe 'POST /api/v1/class_schedules/:id/check_in_member' do
    let!(:active_schedule) do
      ClassSchedule.create!(
        shop: shop, class_type: yoga, instructor: coach,
        starts_at: 10.minutes.from_now, ends_at: 70.minutes.from_now,
        max_capacity: 5, status: 'scheduled', credit_policy: 'attendance', cancellation_hours: 2
      )
    end

    it 'checks in a booked member and deducts attendance credit' do
      # First book member
      post "/api/v1/class_schedules/#{active_schedule.id}/book",
           params: { membership_id: member1.id },
           headers: auth_headers(shop)

      expect(member1.reload.sessions_left).to eq(5) # attendance policy does not deduct on booking

      # Check in member
      post "/api/v1/class_schedules/#{active_schedule.id}/check_in_member",
           params: { membership_id: member1.id },
           headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(member1.reload.sessions_left).to eq(4) # deducted on attendance check-in
      booking = response.parsed_body.dig('class_schedule', 'bookings').find { |b| b['membership_id'] == member1.id }
      expect(booking['status']).to eq('attended')
      expect(booking['checked_in_at']).to be_present
    end
  end
end
