import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Clock3,
  UserPlus,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  mutateClassBooking,
  deleteClassSchedule,
  type ClassSchedule,
  type ClassBooking,
} from '../../lib/classes'
import { toApiError } from '../../lib/errors'
import { Modal } from '../ui/Modal'
import { QuickBookModal } from './QuickBookModal'

interface ClassRosterModalProps {
  schedule: ClassSchedule
  isAdmin: boolean
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onUpdated: () => Promise<void>
}

export function ClassRosterModal({
  schedule,
  isAdmin,
  isOpen,
  onClose,
  onEdit,
  onUpdated,
}: ClassRosterModalProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'roster' | 'waitlist'>('roster')
  const [isQuickBookOpen, setIsQuickBookOpen] = useState(false)
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const bookings = schedule.bookings || []
  const confirmedBookings = bookings.filter((b) => ['booked', 'attended'].includes(b.status))
  const waitlistedBookings = bookings.filter((b) => b.status === 'waitlisted')

  const startTimeStr = new Date(schedule.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const endTimeStr = new Date(schedule.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = new Date(schedule.starts_at).toLocaleDateString([], {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const isFull = schedule.booked_count >= schedule.max_capacity

  async function handleCheckIn(booking: ClassBooking) {
    setActionBusyId(booking.id)
    setError(null)
    try {
      await mutateClassBooking(schedule.id, booking.membership_id, 'check_in_member')
      await onUpdated()
    } catch (err) {
      setError(toApiError(err))
    } finally {
      setActionBusyId(null)
    }
  }

  async function handleCancelBooking(booking: ClassBooking) {
    if (!window.confirm(t('classes.cancel_booking_confirm', 'Bạn có chắc chắn muốn hủy chỗ của hội viên này không?'))) {
      return
    }

    setActionBusyId(booking.id)
    setError(null)
    try {
      await mutateClassBooking(schedule.id, booking.membership_id, 'cancel_booking')
      await onUpdated()
    } catch (err) {
      setError(toApiError(err))
    } finally {
      setActionBusyId(null)
    }
  }

  async function handleDeleteSchedule() {
    if (!window.confirm(t('classes.delete_schedule_confirm', 'Bạn có chắc chắn muốn hủy/xóa lịch lớp này không?'))) {
      return
    }

    try {
      await deleteClassSchedule(schedule.id)
      await onUpdated()
      onClose()
    } catch (err) {
      setError(toApiError(err))
    }
  }

  return (
    <Modal isOpen onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full"
              style={{ backgroundColor: schedule.class_type.color }}
            />
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {schedule.class_type.name}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  {dateStr} • {startTimeStr} - {endTimeStr}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {schedule.instructor?.name || t('classes.unassigned', 'Chưa phân công')}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {schedule.booked_count}/{schedule.max_capacity} {t('classes.spots', 'chỗ')}
                  {isFull && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                      {t('classes.full_badge', 'Đã đủ chỗ')}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQuickBookOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{t('classes.book_member_btn', 'Thêm hội viên')}</span>
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  title={t('common.edit', 'Sửa')}
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSchedule}
                  title={t('common.delete', 'Xóa')}
                  className="rounded-xl border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab navigation: Roster vs Waitlist */}
        <div className="mt-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'roster'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {t('classes.roster_title', 'Danh sách lớp')} ({confirmedBookings.length}/{schedule.max_capacity})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('waitlist')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'waitlist'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {t('classes.waitlist_title', 'Hàng đợi chờ (Waitlist)')} ({waitlistedBookings.length})
          </button>
        </div>

        {/* Content list */}
        <div className="mt-4 space-y-2">
          {activeTab === 'roster' ? (
            confirmedBookings.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {t('classes.roster_empty', 'Chưa có hội viên nào đăng ký lớp này.')}
              </div>
            ) : (
              confirmedBookings.map((b) => {
                const isAttended = b.status === 'attended'
                const isBusy = actionBusyId === b.id

                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200/60 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {b.customer_name[0]?.toUpperCase() || 'M'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{b.customer_name}</h4>
                        <p className="text-slate-500 dark:text-slate-400">{b.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAttended ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{t('classes.status_attended', 'Đã tham gia')}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleCheckIn(b)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-40 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                        >
                          {isBusy ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          <span>{t('classes.check_in_btn', 'Điểm danh')}</span>
                        </button>
                      )}

                      {!isAttended && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleCancelBooking(b)}
                          title={t('classes.cancel_booking_btn', 'Hủy chỗ')}
                          className="rounded-xl border border-slate-200 p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )
          ) : waitlistedBookings.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {t('classes.waitlist_empty', 'Hàng đợi chờ đang trống.')}
            </div>
          ) : (
            waitlistedBookings.map((b, idx) => {
              const isBusy = actionBusyId === b.id

              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">{b.customer_name}</h4>
                      <p className="text-slate-500 dark:text-slate-400">{b.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                      <Clock3 className="h-3 w-3" />
                      <span>{t('classes.status_waitlisted', 'Chờ chỗ')}</span>
                    </span>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleCancelBooking(b)}
                      title={t('classes.cancel_booking_btn', 'Hủy chỗ')}
                      className="rounded-xl border border-slate-200 p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <QuickBookModal
        schedule={schedule}
        isOpen={isQuickBookOpen}
        onClose={() => setIsQuickBookOpen(false)}
        onBooked={onUpdated}
      />
    </Modal>
  )
}
