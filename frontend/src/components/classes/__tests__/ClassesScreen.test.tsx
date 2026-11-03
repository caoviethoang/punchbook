import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { ClassesScreen } from '../../ClassesScreen'
import * as classesApi from '../../../lib/classes'
import type { Staff } from '../../../lib/auth'

vi.mock('../../../lib/classes', async () => {
  const actual = await vi.importActual<typeof classesApi>('../../../lib/classes')
  return {
    ...actual,
    fetchClassTypes: vi.fn(),
    fetchSchedules: vi.fn(),
    fetchClassSchedule: vi.fn(),
    mutateClassBooking: vi.fn(),
    createClassSchedules: vi.fn(),
    deleteClassSchedule: vi.fn(),
  }
})

describe('ClassesScreen', () => {
  const mockStaff: Staff = {
    id: 'staff-1',
    name: 'Admin User',
    username: 'admin',
    role: 'admin',
  }

  const mockTypes: classesApi.ClassType[] = [
    {
      id: 'type-1',
      name: 'Yoga Flow',
      description: 'Relaxing yoga',
      color: '#6366f1',
      default_capacity: 15,
      default_duration_minutes: 60,
    },
    {
      id: 'type-2',
      name: 'HIIT Boxing',
      description: 'Intense boxing',
      color: '#ef4444',
      default_capacity: 20,
      default_duration_minutes: 45,
    },
  ]

  const now = new Date()
  const mockSchedules: classesApi.ClassSchedule[] = [
    {
      id: 'sched-1',
      class_type: mockTypes[0],
      instructor: { id: 'staff-1', name: 'Coach Linh' },
      starts_at: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString(),
      ends_at: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0).toISOString(),
      max_capacity: 15,
      status: 'scheduled',
      credit_policy: 'attendance',
      cancellation_hours: 2,
      series_id: null,
      booked_count: 5,
      waitlisted_count: 0,
      bookings: [
        {
          id: 'b-1',
          membership_id: 'm-1',
          customer_name: 'Nguyen Van A',
          phone: '0901112222',
          status: 'booked',
          credit_deducted: false,
          checked_in_at: null,
          promoted_at: null,
          promotion_notified_at: null,
        },
      ],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(classesApi.fetchClassTypes).mockResolvedValue({ class_types: mockTypes })
    vi.mocked(classesApi.fetchSchedules).mockResolvedValue({ class_schedules: mockSchedules })
    vi.mocked(classesApi.fetchClassSchedule).mockResolvedValue({ class_schedule: mockSchedules[0] })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders classes screen with title and scheduled classes', async () => {
    render(<ClassesScreen currentStaff={mockStaff} />)

    expect(screen.getByText('Lịch tập lớp & Đặt chỗ')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getAllByText('Yoga Flow').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Coach Linh')).toBeInTheDocument()
      expect(screen.getByText('5/15')).toBeInTheDocument()
    })
  })

  it('switches calendar views (day, week, month)', async () => {
    render(<ClassesScreen currentStaff={mockStaff} />)

    await waitFor(() => {
      expect(screen.getAllByText('Yoga Flow').length).toBeGreaterThanOrEqual(1)
    })

    const dayBtn = screen.getByText('Ngày')
    fireEvent.click(dayBtn)

    await waitFor(() => {
      expect(screen.getByText('5/15 chỗ')).toBeInTheDocument()
    })

    const monthBtn = screen.getByText('Tháng')
    fireEvent.click(monthBtn)

    await waitFor(() => {
      expect(screen.getByText('T2')).toBeInTheDocument()
      expect(screen.getByText('CN')).toBeInTheDocument()
    })
  })

  it('opens roster modal on class click and allows check-in', async () => {
    render(<ClassesScreen currentStaff={mockStaff} />)

    await waitFor(() => {
      expect(screen.getAllByText('Yoga Flow').length).toBeGreaterThanOrEqual(1)
    })

    const classCard = screen.getAllByText('Yoga Flow')[1] || screen.getAllByText('Yoga Flow')[0]
    fireEvent.click(classCard)

    await waitFor(() => {
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
      expect(screen.getByText('Điểm danh')).toBeInTheDocument()
    })

    vi.mocked(classesApi.mutateClassBooking).mockResolvedValue({
      class_schedule: {
        ...mockSchedules[0],
        bookings: [
          {
            ...mockSchedules[0].bookings![0],
            status: 'attended',
            checked_in_at: new Date().toISOString(),
          },
        ],
      },
    })

    const checkInBtn = screen.getByText('Điểm danh')
    fireEvent.click(checkInBtn)

    await waitFor(() => {
      expect(classesApi.mutateClassBooking).toHaveBeenCalledWith(
        'sched-1',
        'm-1',
        'check_in_member'
      )
    })
  })

  it('opens class type manager when button is clicked', async () => {
    render(<ClassesScreen currentStaff={mockStaff} />)

    const manageBtn = screen.getByText('Quản lý môn')
    fireEvent.click(manageBtn)

    await waitFor(() => {
      expect(screen.getByText('Danh sách môn học')).toBeInTheDocument()
    })
  })

  it('opens schedule editor modal when new class button is clicked', async () => {
    render(<ClassesScreen currentStaff={mockStaff} />)

    const newClassBtn = screen.getByText('Lên lịch lớp mới')
    fireEvent.click(newClassBtn)

    await waitFor(() => {
      expect(screen.getByText('Lên lịch lớp mới', { selector: 'h2' })).toBeInTheDocument()
    })
  })
})
