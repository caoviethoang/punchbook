import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Loader2, UserPlus, AlertCircle } from 'lucide-react'
import { searchMemberships, type Membership } from '../../lib/memberships'
import { mutateClassBooking, type ClassSchedule } from '../../lib/classes'
import { toApiError } from '../../lib/errors'
import { Modal } from '../ui/Modal'

interface QuickBookModalProps {
  schedule: ClassSchedule
  isOpen: boolean
  onClose: () => void
  onBooked: () => void
}

export function QuickBookModal({ schedule, isOpen, onClose, onBooked }: QuickBookModalProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Membership[]>([])
  const [searching, setSearching] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const trimmedQuery = query.trim()

  useEffect(() => {
    if (!trimmedQuery) return

    let active = true
    const timer = setTimeout(() => {
      setSearching(true)
      searchMemberships(trimmedQuery)
        .then((data) => {
          if (active) setResults(data)
        })
        .catch((err) => {
          if (active) setError(toApiError(err))
        })
        .finally(() => {
          if (active) setSearching(false)
        })
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [trimmedQuery])

  async function handleBook(membershipId: string) {
    setBookingId(membershipId)
    setError(null)
    try {
      await mutateClassBooking(schedule.id, membershipId, 'book')
      onBooked()
      onClose()
    } catch (err) {
      setError(toApiError(err))
    } finally {
      setBookingId(null)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen onClose={onClose} maxWidthClass="max-w-lg">
      <div className="p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t('classes.book_member_btn', 'Thêm hội viên vào lớp')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {schedule.class_type.name} • {new Date(schedule.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative mt-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (!e.target.value.trim()) {
                setResults([])
              }
            }}
            placeholder={t('classes.search_member_placeholder', 'Tìm theo tên hoặc số điện thoại...')}
            className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="mt-4 max-h-72 overflow-y-auto space-y-2">
          {searching ? (
            <div className="flex items-center justify-center py-8 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>{t('common.loading', 'Đang tìm kiếm...')}</span>
            </div>
          ) : query && results.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {t('memberships.empty_state', 'Không tìm thấy hội viên nào.')}
            </div>
          ) : (
            results.map((m) => {
              const isEnrolled = schedule.bookings?.some((b) => b.membership_id === m.id && b.status !== 'cancelled')
              const isBooking = bookingId === m.id

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-xs transition hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-800"
                >
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">{m.customer_name}</h4>
                    <p className="text-slate-500 dark:text-slate-400">{m.phone}</p>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400">
                      {m.package?.name} •{' '}
                      {m.sessions_left !== null && m.sessions_left !== undefined
                        ? t('memberships.sessions_remaining', 'Còn {{rem}} buổi', { rem: m.sessions_left })
                        : m.expires_at
                        ? `${t('common.until', 'Đến')} ${m.expires_at}`
                        : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isEnrolled || isBooking}
                    onClick={() => handleBook(m.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-40 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    {isBooking ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    <span>{isEnrolled ? t('classes.status_booked', 'Đã có trong lớp') : t('classes.book_btn', 'Đăng ký')}</span>
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </Modal>
  )
}
