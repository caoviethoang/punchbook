import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { QuickBookModal } from '../QuickBookModal'
import * as membershipsApi from '../../../lib/memberships'
import * as classesApi from '../../../lib/classes'

vi.mock('../../../lib/memberships', () => ({
  searchMemberships: vi.fn(),
}))

vi.mock('../../../lib/classes', () => ({
  mutateClassBooking: vi.fn(),
}))

describe('QuickBookModal', () => {
  const onClose = vi.fn()
  const onBooked = vi.fn()

  const mockSchedule: classesApi.ClassSchedule = {
    id: 'sched-1',
    class_type: { id: 'type-1', name: 'Yoga Flow', color: '#6366f1', description: 'Yoga' },
    instructor: { id: 'staff-1', name: 'Coach Linh' },
    starts_at: '2026-11-03T09:00:00Z',
    ends_at: '2026-11-03T10:00:00Z',
    max_capacity: 10,
    status: 'scheduled',
    credit_policy: 'attendance',
    cancellation_hours: 2,
    series_id: null,
    booked_count: 2,
    waitlisted_count: 0,
    bookings: [],
  }

  const mockMembers = [
    {
      id: 'm-1',
      customer_name: 'Tran Thi B',
      phone: '0908889999',
      sessions_left: 10,
      expires_at: '2026-12-31',
      package: { id: 'p-1', name: 'Gói 10 buổi' },
    },
  ] as unknown as membershipsApi.Membership[]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(membershipsApi.searchMemberships).mockResolvedValue(mockMembers)
  })

  afterEach(() => {
    cleanup()
  })

  it('searches for members and books member into class', async () => {
    vi.mocked(classesApi.mutateClassBooking).mockResolvedValue({
      class_schedule: mockSchedule,
    })

    render(
      <QuickBookModal
        schedule={mockSchedule}
        isOpen={true}
        onClose={onClose}
        onBooked={onBooked}
      />
    )

    const input = screen.getByPlaceholderText('Tìm theo tên hoặc số điện thoại...')
    fireEvent.change(input, { target: { value: 'Tran' } })

    await waitFor(() => {
      expect(screen.getByText('Tran Thi B')).toBeInTheDocument()
      expect(screen.getByText('0908889999')).toBeInTheDocument()
    })

    const bookBtn = screen.getByText('Đăng ký')
    fireEvent.click(bookBtn)

    await waitFor(() => {
      expect(classesApi.mutateClassBooking).toHaveBeenCalledWith('sched-1', 'm-1', 'book')
      expect(onBooked).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })
})
