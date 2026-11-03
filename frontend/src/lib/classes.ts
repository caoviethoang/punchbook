import { apiDelete, apiGet, apiPatch, apiPost } from './api'

export interface ClassType {
  id: string; name: string; description: string | null; color: string
  default_capacity: number; default_duration_minutes: number
}
export interface ClassBooking {
  id: string; membership_id: string; customer_name: string; phone: string
  status: 'booked' | 'waitlisted' | 'attended' | 'no_show' | 'cancelled'
  credit_deducted: boolean; checked_in_at: string | null; promoted_at: string | null
  promotion_notified_at: string | null
}
export interface ClassSchedule {
  id: string; class_type: Pick<ClassType, 'id' | 'name' | 'color' | 'description'>
  instructor: { id: string; name: string } | null
  starts_at: string; ends_at: string; max_capacity: number
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  credit_policy: 'attendance' | 'booking'; cancellation_hours: number; series_id: string | null
  booked_count: number; waitlisted_count: number; bookings?: ClassBooking[]
}
export interface ScheduleInput {
  class_type_id: string; instructor_id: string | null; starts_at: string; ends_at: string
  max_capacity: number; credit_policy: 'attendance' | 'booking'; cancellation_hours: number
}
export interface Recurrence { until: string; weekdays: number[]; time_zone: string }
export const fetchClassTypes = () => apiGet<{ class_types: ClassType[] }>('/class_types')
export const saveClassType = (value: Omit<ClassType, 'id'>, id?: string) => id
  ? apiPatch(`/class_types/${id}`, { class_type: value })
  : apiPost('/class_types', { class_type: value })
export const deleteClassType = (id: string) => apiDelete(`/class_types/${id}`)
export const fetchSchedules = (from: Date, to: Date) => apiGet<{ class_schedules: ClassSchedule[] }>(
  `/class_schedules?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
)
export const fetchClassSchedule = (id: string) => apiGet<{ class_schedule: ClassSchedule }>(`/class_schedules/${id}`)
export const createClassSchedules = (value: ScheduleInput, recurrence?: Recurrence) =>
  apiPost('/class_schedules', { class_schedule: value, recurrence })
export const updateClassSchedule = (id: string, value: Partial<ScheduleInput> & { status?: ClassSchedule['status'] }) =>
  apiPatch(`/class_schedules/${id}`, { class_schedule: value })
export const deleteClassSchedule = (id: string) => apiDelete(`/class_schedules/${id}`)
export const mutateClassBooking = (id: string, membershipId: string, action: 'book' | 'cancel_booking' | 'check_in_member') =>
  apiPost<{ class_schedule: ClassSchedule }>(`/class_schedules/${id}/${action}`, { membership_id: membershipId })

export type CalendarView = 'day' | 'week' | 'month'
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function calendarDays(anchor: Date, view: CalendarView): Date[] {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), view === 'month' ? 1 : anchor.getDate())
  if (view !== 'day') start.setDate(start.getDate() - (start.getDay() + 6) % 7)
  return Array.from({ length: view === 'day' ? 1 : view === 'week' ? 7 : 42 }, (_, i) => {
    const day = new Date(start); day.setDate(day.getDate() + i); return day
  })
}
