# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'ClassSchedules API', type: :request do
  let!(:shop) { create_shop(name: 'Yoga Hub', phone: '0901112222') }
  let!(:yoga) do
    ClassType.create!(
      shop: shop, name: 'Yoga Flow', color: '#6366f1',
      default_capacity: 10, default_duration_minutes: 60
    )
  end

  def create_coach
    Staff.create!(shop: shop, name: 'Instructor Linh', username: 'linh1', password: 'password123', role: 'staff')
  end

  def create_member(name: 'Nguyen Van A', phone: '0901111111', sessions: 5)
    pkg = Package.find_or_create_by!(shop: shop, name: '10 Sessions') do |p|
      p.sessions_count = 10
      p.price = 1_000_000
    end
    Membership.create!(
      shop: shop, package: pkg, customer_name: name,
      phone: phone, sessions_left: sessions, expires_at: Date.current + 30.days
    )
  end

  def create_schedule(capacity: 1, policy: 'booking', starts_at: 2.hours.from_now)
    ClassSchedule.create!(
      shop: shop, class_type: yoga, instructor: create_coach,
      starts_at: starts_at, ends_at: starts_at + 1.hour,
      max_capacity: capacity, status: 'scheduled',
      credit_policy: policy, cancellation_hours: 1
    )
  end

  describe 'GET /api/v1/class_schedules' do
    it 'returns schedules within the date range' do
      schedule = create_schedule

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
      coach = create_coach
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
      schedule = create_schedule(capacity: 1)
      primary_member = create_member(name: 'Nguyen Van A', phone: '0901111111', sessions: 5)
      waitlist_member = create_member(name: 'Tran Thi B', phone: '0902222222', sessions: 3)

      post "/api/v1/class_schedules/#{schedule.id}/book",
           params: { membership_id: primary_member.id },
           headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      roster = response.parsed_body.dig('class_schedule', 'bookings')
      first_booking = roster.find { |b| b['membership_id'] == primary_member.id }
      expect(first_booking['status']).to eq('booked')
      expect(primary_member.reload.sessions_left).to eq(4) # deducted because credit_policy is 'booking'

      post "/api/v1/class_schedules/#{schedule.id}/book",
           params: { membership_id: waitlist_member.id },
           headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      roster = response.parsed_body.dig('class_schedule', 'bookings')
      second_booking = roster.find { |b| b['membership_id'] == waitlist_member.id }
      expect(second_booking['status']).to eq('waitlisted')
      expect(waitlist_member.reload.sessions_left).to eq(3) # not deducted while waitlisted
    end

    it 'promotes the waitlisted member when the booked member cancels' do
      schedule = create_schedule(capacity: 1)
      primary_member = create_member(name: 'Nguyen Van A', phone: '0901111111', sessions: 5)
      waitlist_member = create_member(name: 'Tran Thi B', phone: '0902222222', sessions: 3)

      post "/api/v1/class_schedules/#{schedule.id}/book",
           params: { membership_id: primary_member.id },
           headers: auth_headers(shop)
      post "/api/v1/class_schedules/#{schedule.id}/book",
           params: { membership_id: waitlist_member.id },
           headers: auth_headers(shop)

      post "/api/v1/class_schedules/#{schedule.id}/cancel_booking",
           params: { membership_id: primary_member.id },
           headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(primary_member.reload.sessions_left).to eq(5) # refunded

      roster = response.parsed_body.dig('class_schedule', 'bookings')
      b1 = roster.find { |b| b['membership_id'] == primary_member.id }
      b2 = roster.find { |b| b['membership_id'] == waitlist_member.id }
      expect(b1['status']).to eq('cancelled')
      expect(b2['status']).to eq('booked')
      expect(waitlist_member.reload.sessions_left).to eq(2) # deducted on promotion
    end
  end

  describe 'POST /api/v1/class_schedules/:id/check_in_member' do
    it 'checks in a booked member and deducts attendance credit' do
      active_schedule = create_schedule(
        capacity: 5, policy: 'attendance', starts_at: 10.minutes.from_now
      )
      member = create_member(sessions: 5)

      # First book member
      post "/api/v1/class_schedules/#{active_schedule.id}/book",
           params: { membership_id: member.id },
           headers: auth_headers(shop)

      expect(member.reload.sessions_left).to eq(5) # attendance policy does not deduct on booking

      # Check in member
      post "/api/v1/class_schedules/#{active_schedule.id}/check_in_member",
           params: { membership_id: member.id },
           headers: auth_headers(shop)

      expect(response).to have_http_status(:ok)
      expect(member.reload.sessions_left).to eq(4) # deducted on attendance check-in
      booking = response.parsed_body.dig('class_schedule', 'bookings').find { |b| b['membership_id'] == member.id }
      expect(booking['status']).to eq('attended')
      expect(booking['checked_in_at']).to be_present
    end
  end
end
