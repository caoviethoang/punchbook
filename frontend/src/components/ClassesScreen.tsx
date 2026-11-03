import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Clock,
  User,
  Users,
  Loader2,
  CalendarDays,
} from 'lucide-react'
import type { Staff } from '../lib/auth'
import {
  fetchClassTypes,
  fetchSchedules,
  fetchClassSchedule,
  calendarDays,
  dateKey,
  type ClassType,
  type ClassSchedule,
  type CalendarView,
} from '../lib/classes'
import { toApiError } from '../lib/errors'
import { ClassTypeManager } from './classes/ClassTypeManager'
import { ScheduleEditor } from './classes/ScheduleEditor'
import { ClassRosterModal } from './classes/ClassRosterModal'

interface ClassesScreenProps {
  currentStaff?: Staff | null
}

export function ClassesScreen({ currentStaff }: ClassesScreenProps) {
  const { t } = useTranslation()
  const isAdmin = !currentStaff || currentStaff.role === 'admin'

  const [types, setTypes] = useState<ClassType[]>([])
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [anchorDate, setAnchorDate] = useState<Date>(new Date())
  const [view, setView] = useState<CalendarView>('week')
  const [selectedTypeId, setSelectedTypeId] = useState<string>('all')

  // Modals
  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | undefined>(undefined)
  const [editorInitialDate, setEditorInitialDate] = useState<Date | undefined>(undefined)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [selectedRosterSchedule, setSelectedRosterSchedule] = useState<ClassSchedule | null>(null)

  // Load class types
  const loadTypes = useCallback(async () => {
    try {
      const res = await fetchClassTypes()
      setTypes(res.class_types)
    } catch (err) {
      setError(toApiError(err))
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchClassTypes()
      .then((res) => {
        if (active) setTypes(res.class_types)
      })
      .catch((err) => {
        if (active) setError(toApiError(err))
      })
    return () => {
      active = false
    }
  }, [])

  // Calculate calendar days in view
  const days = useMemo(() => calendarDays(anchorDate, view), [anchorDate, view])

  // Load schedules for active calendar range
  const loadSchedules = useCallback(async () => {
    if (days.length === 0) return
    const firstDay = days[0]
    const lastDay = days[days.length - 1]
    const from = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate(), 0, 0, 0)
    const to = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59)

    setLoading(true)
    setError(null)
    try {
      const res = await fetchSchedules(from, to)
      setSchedules(res.class_schedules)
    } catch (err) {
      setError(toApiError(err))
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    if (days.length === 0) return
    let active = true
    const firstDay = days[0]
    const lastDay = days[days.length - 1]
    const from = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate(), 0, 0, 0)
    const to = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59)

    fetchSchedules(from, to)
      .then((res) => {
        if (active) setSchedules(res.class_schedules)
      })
      .catch((err) => {
        if (active) setError(toApiError(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [days])

  // Handle open roster detail
  const handleOpenRoster = async (scheduleId: string) => {
    try {
      const res = await fetchClassSchedule(scheduleId)
      setSelectedRosterSchedule(res.class_schedule)
    } catch (err) {
      setError(toApiError(err))
    }
  }

  // Refresh current roster if open
  const handleRosterUpdated = async () => {
    if (selectedRosterSchedule) {
      const res = await fetchClassSchedule(selectedRosterSchedule.id)
      setSelectedRosterSchedule(res.class_schedule)
    }
    await loadSchedules()
  }

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(anchorDate)
    if (view === 'day') next.setDate(next.getDate() - 1)
    else if (view === 'week') next.setDate(next.getDate() - 7)
    else next.setMonth(next.getMonth() - 1)
    setAnchorDate(next)
  }

  const handleNext = () => {
    const next = new Date(anchorDate)
    if (view === 'day') next.setDate(next.getDate() + 1)
    else if (view === 'week') next.setDate(next.getDate() + 7)
    else next.setMonth(next.getMonth() + 1)
    setAnchorDate(next)
  }

  const handleToday = () => {
    setAnchorDate(new Date())
  }

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    if (selectedTypeId === 'all') return schedules
    return schedules.filter((s) => s.class_type.id === selectedTypeId)
  }, [schedules, selectedTypeId])

  // Group schedules by date key (YYYY-MM-DD)
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, ClassSchedule[]>()
    for (const schedule of filteredSchedules) {
      const k = dateKey(new Date(schedule.starts_at))
      const list = map.get(k) || []
      list.push(schedule)
      map.set(k, list)
    }
    return map
  }, [filteredSchedules])

  // Formatted date label
  const dateLabel = useMemo(() => {
    if (view === 'day') {
      return anchorDate.toLocaleDateString([], {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }
    if (view === 'week') {
      const start = days[0]
      const end = days[6]
      return `${start.toLocaleDateString([], { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString([], {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })}`
    }
    return anchorDate.toLocaleDateString([], { month: 'long', year: 'numeric' })
  }, [anchorDate, view, days])

  const todayKey = dateKey(new Date())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t('classes.title', 'Lịch tập lớp & Đặt chỗ')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t(
              'classes.subtitle',
              'Quản lý lịch học nhóm, kiểm soát sĩ số, danh sách chờ và điểm danh lớp.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setIsTypeManagerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>{t('classes.manage_types', 'Quản lý môn')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingSchedule(undefined)
                  setIsEditorOpen(true)
                }}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t('classes.new_class', 'Lên lịch lớp mới')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Calendar Toolbar */}
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation & Date display */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/80 transition"
          >
            {t('classes.today', 'Hôm nay')}
          </button>
          <div className="flex items-center">
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-xl p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-xl p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm font-bold capitalize text-slate-900 dark:text-slate-100">
            {dateLabel}
          </span>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />}
        </div>

        {/* View Switcher & Dropdown */}
        <div className="flex items-center gap-2.5">
          {/* Class Type filter dropdown */}
          <select
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">{t('classes.all_types', 'Tất cả môn')}</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>

          {/* Day / Week / Month toggles */}
          <div className="flex items-center rounded-2xl border border-slate-200/80 bg-slate-100/70 p-1 dark:border-slate-700 dark:bg-slate-800/80">
            {(['day', 'week', 'month'] as CalendarView[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${
                  view === v
                    ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {t(`classes.${v}`, v)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Category Filter Pills */}
      {types.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedTypeId('all')}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-1.5 font-semibold transition ${
              selectedTypeId === 'all'
                ? 'bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-900'
                : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <span>{t('classes.all_types', 'Tất cả môn')}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                selectedTypeId === 'all'
                  ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {schedules.length}
            </span>
          </button>

          {types.map((type) => {
            const isSelected = selectedTypeId === type.id
            const count = schedules.filter((s) => s.class_type.id === type.id).length
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedTypeId(type.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-2xl border px-3 py-1.5 font-semibold transition ${
                  isSelected
                    ? 'shadow-xs'
                    : 'border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: `${type.color}15`,
                        color: type.color,
                        borderColor: type.color,
                      }
                    : undefined
                }
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: type.color }}
                />
                <span>
                  {type.name} ({count})
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Calendar Body */}
      {view === 'week' ? (
        <div className="overflow-x-auto pb-4 pt-1 -mx-2 px-2">
          <div className="grid min-w-[770px] grid-cols-7 gap-3 xl:min-w-0">
            {days.map((day) => {
              const k = dateKey(day)
              const isToday = k === todayKey
              const daySchedules = schedulesByDate.get(k) || []
              const dayName = day.toLocaleDateString([], { weekday: 'short' })

              return (
                <div
                  key={k}
                  className={`flex flex-col min-h-[480px] rounded-3xl border transition shadow-xs ${
                    isToday
                      ? 'border-indigo-400/80 bg-gradient-to-b from-indigo-50/40 via-indigo-50/10 to-transparent dark:border-indigo-600/60 dark:from-indigo-950/40 dark:via-transparent ring-1 ring-indigo-400/30'
                      : 'border-slate-200/90 bg-white/80 dark:border-slate-800/90 dark:bg-slate-900/80'
                  }`}
                >
                  {/* Day Header */}
                  <div
                    className={`p-3 pb-2.5 border-b flex items-center justify-between ${
                      isToday
                        ? 'border-indigo-100 dark:border-indigo-900/50'
                        : 'border-slate-100 dark:border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                          isToday
                            ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-sm ring-2 ring-indigo-400/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            {dayName}
                          </span>
                          {isToday && (
                            <span className="inline-flex items-center rounded-full bg-indigo-100 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              {t('classes.today', 'Hôm nay')}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          {daySchedules.length} {t('classes.sessions', 'ca')}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        title={t('classes.new_class', 'Lên lịch lớp mới')}
                        onClick={() => {
                          const d = new Date(day)
                          d.setHours(8, 0, 0, 0)
                          setEditorInitialDate(d)
                          setEditingSchedule(undefined)
                          setIsEditorOpen(true)
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Day Class cards */}
                  <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto">
                    {daySchedules.length === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/80 p-4 text-center dark:border-slate-800/80 min-h-[140px]">
                        <CalendarDays className="h-5 w-5 text-slate-300 dark:text-slate-600 mb-1" />
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                          {t('classes.no_classes', 'Chưa có lớp')}
                        </p>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date(day)
                              d.setHours(8, 0, 0, 0)
                              setEditorInitialDate(d)
                              setEditingSchedule(undefined)
                              setIsEditorOpen(true)
                            }}
                            className="mt-2 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                          >
                            + {t('classes.new_class', 'Lên lịch lớp mới')}
                          </button>
                        )}
                      </div>
                    ) : (
                      daySchedules.map((s) => {
                        const startTime = new Date(s.starts_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        const endTime = new Date(s.ends_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        const isFull = s.booked_count >= s.max_capacity
                        const durationMin = Math.round(
                          (new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) / 60000
                        )
                        const fillPct = s.max_capacity > 0 ? (s.booked_count / s.max_capacity) * 100 : 0

                        return (
                          <div
                            key={s.id}
                            onClick={() => handleOpenRoster(s.id)}
                            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-slate-800/90 dark:bg-slate-800/90 dark:hover:border-slate-700 dark:hover:bg-slate-800 active:scale-[0.98]"
                          >
                            {/* Top color indicator bar */}
                            <div
                              className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
                              style={{ backgroundColor: s.class_type.color }}
                            />

                            {/* Time & Duration row */}
                            <div className="flex items-center justify-between text-[11px] font-medium pt-0.5">
                              <span className="inline-flex items-center gap-1 font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-700/60 px-1.5 py-0.5 rounded-md">
                                <Clock className="h-3 w-3 text-slate-400" />
                                {startTime} - {endTime}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                                {durationMin}p
                              </span>
                            </div>

                            {/* Class Title */}
                            <h4
                              className="mt-2 font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                              title={s.class_type.name}
                            >
                              {s.class_type.name}
                            </h4>

                            {/* Instructor with Avatar circle */}
                            {s.instructor && (
                              <div
                                className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 truncate"
                                title={s.instructor.name}
                              >
                                <span
                                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-2xs"
                                  style={{ backgroundColor: s.class_type.color }}
                                >
                                  {s.instructor.name.trim().charAt(0).toUpperCase()}
                                </span>
                                <span className="truncate">{s.instructor.name}</span>
                              </div>
                            )}

                            {/* Capacity & Progress */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                              <div className="flex items-center justify-between text-[10px]">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                                    isFull
                                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  }`}
                                >
                                  <Users className="h-2.5 w-2.5 shrink-0" />
                                  {s.booked_count}/{s.max_capacity}
                                </span>

                                {s.waitlisted_count > 0 && (
                                  <span className="inline-flex items-center rounded-full bg-amber-100/90 px-1.5 py-0.5 font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                    +{s.waitlisted_count} {t('classes.status_waitlisted', 'chờ')}
                                  </span>
                                )}
                              </div>

                              {/* Occupancy bar */}
                              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isFull
                                      ? 'bg-rose-500'
                                      : fillPct >= 80
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(100, fillPct)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : view === 'day' ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-3">
            {filteredSchedules.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                <CalendarDays className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p>{t('classes.no_classes_day', 'Không có lịch lớp nào trong ngày này.')}</p>
              </div>
            ) : (
              filteredSchedules.map((s) => {
                const startTime = new Date(s.starts_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const endTime = new Date(s.ends_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const isFull = s.booked_count >= s.max_capacity
                const durationMin = Math.round(
                  (new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) / 60000
                )
                const fillPct = s.max_capacity > 0 ? (s.booked_count / s.max_capacity) * 100 : 0

                return (
                  <div
                    key={s.id}
                    onClick={() => handleOpenRoster(s.id)}
                    className="group relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/90 dark:bg-slate-800/80 dark:hover:border-slate-700"
                  >
                    <div
                      className="absolute top-0 bottom-0 left-0 w-1.5 transition-all group-hover:w-2"
                      style={{ backgroundColor: s.class_type.color }}
                    />

                    <div className="flex items-center gap-3.5 pl-2">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-bold text-white shadow-xs"
                        style={{ backgroundColor: s.class_type.color }}
                      >
                        {s.class_type.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400 transition-colors">
                          {s.class_type.name}
                        </h4>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {startTime} - {endTime} ({durationMin}p)
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            {s.instructor?.name || t('classes.unassigned', 'Chưa phân công')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs pl-2 sm:pl-0">
                      <div className="w-36">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                            <Users className="h-3 w-3 text-slate-400" />
                            {s.booked_count}/{s.max_capacity} {t('classes.spots', 'chỗ')}
                          </span>
                          {isFull && (
                            <span className="rounded-full bg-rose-100 px-2 py-0.2 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                              {t('classes.full_badge', 'Đủ chỗ')}
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isFull
                                ? 'bg-rose-500'
                                : fillPct >= 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, fillPct)}%` }}
                          />
                        </div>
                      </div>

                      {s.waitlisted_count > 0 && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          {s.waitlisted_count} {t('classes.status_waitlisted', 'chờ')}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      ) : (
        /* Month View */
        <div className="grid grid-cols-7 gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((h) => (
            <div key={h} className="text-center font-bold text-xs text-slate-400 py-1">
              {h}
            </div>
          ))}

          {days.map((day) => {
            const k = dateKey(day)
            const isToday = k === todayKey
            const isSameMonth = day.getMonth() === anchorDate.getMonth()
            const daySchedules = schedulesByDate.get(k) || []

            return (
              <div
                key={k}
                onClick={() => {
                  setAnchorDate(day)
                  setView('day')
                }}
                className={`min-h-[70px] cursor-pointer rounded-2xl border p-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  isToday
                    ? 'border-indigo-400 bg-indigo-50/20 dark:border-indigo-800'
                    : 'border-slate-100 dark:border-slate-800/60'
                } ${!isSameMonth ? 'opacity-40' : ''}`}
              >
                <div className="flex justify-between items-center text-[11px] font-semibold">
                  <span className={isToday ? 'text-indigo-600 font-bold dark:text-indigo-400' : ''}>
                    {day.getDate()}
                  </span>
                  {daySchedules.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-normal">
                      {daySchedules.length}
                    </span>
                  )}
                </div>

                <div className="mt-1 space-y-1">
                  {daySchedules.slice(0, 2).map((s) => (
                    <div
                      key={s.id}
                      className="truncate rounded-md px-1 py-0.5 text-[9px] font-medium"
                      style={{
                        backgroundColor: `${s.class_type.color}15`,
                        color: s.class_type.color,
                      }}
                    >
                      {s.class_type.name}
                    </div>
                  ))}
                  {daySchedules.length > 2 && (
                    <div className="text-[9px] text-slate-400 font-semibold pl-1">
                      +{daySchedules.length - 2}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Class Type Manager Modal */}
      {isTypeManagerOpen && (
        <ClassTypeManager
          types={types}
          onClose={() => setIsTypeManagerOpen(false)}
          onSaved={async () => {
            await loadTypes()
            await loadSchedules()
          }}
        />
      )}

      {/* Schedule Editor Modal */}
      {isEditorOpen && (
        <ScheduleEditor
          types={types}
          schedule={editingSchedule}
          initialDate={editorInitialDate}
          onClose={() => {
            setIsEditorOpen(false)
            setEditingSchedule(undefined)
            setEditorInitialDate(undefined)
          }}
          onSaved={loadSchedules}
        />
      )}

      {/* Class Roster Modal */}
      {selectedRosterSchedule && (
        <ClassRosterModal
          schedule={selectedRosterSchedule}
          isAdmin={isAdmin}
          isOpen={true}
          onClose={() => setSelectedRosterSchedule(null)}
          onEdit={() => {
            setEditingSchedule(selectedRosterSchedule)
            setSelectedRosterSchedule(null)
            setIsEditorOpen(true)
          }}
          onUpdated={handleRosterUpdated}
        />
      )}
    </div>
  )
}
