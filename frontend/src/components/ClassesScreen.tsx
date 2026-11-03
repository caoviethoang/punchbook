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
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation & Date display */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t('classes.today', 'Hôm nay')}
          </button>
          <div className="flex items-center">
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-xl p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-xl p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm font-bold capitalize text-slate-900 dark:text-slate-100">
            {dateLabel}
          </span>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
        </div>

        {/* View Switcher & Filter */}
        <div className="flex items-center gap-2">
          {/* Class Type filter */}
          <select
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">{t('classes.all_types', 'Tất cả môn')}</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>

          {/* Day / Week / Month toggles */}
          <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50/50 p-1 dark:border-slate-700 dark:bg-slate-800">
            {(['day', 'week', 'month'] as CalendarView[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                  view === v
                    ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-indigo-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {t(`classes.${v}`, v)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Body */}
      {view === 'week' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
          {days.map((day) => {
            const k = dateKey(day)
            const isToday = k === todayKey
            const daySchedules = schedulesByDate.get(k) || []

            return (
              <div
                key={k}
                className={`flex flex-col min-h-[300px] rounded-3xl border p-3 transition ${
                  isToday
                    ? 'border-indigo-300 bg-indigo-50/20 dark:border-indigo-900/60 dark:bg-indigo-950/20'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                {/* Day Header */}
                <div className="pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {day.toLocaleDateString([], { weekday: 'short' })}
                  </span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isToday
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Day Class cards */}
                <div className="mt-2.5 flex-1 space-y-2 overflow-y-auto">
                  {daySchedules.length === 0 ? (
                    <div className="flex h-24 items-center justify-center text-[11px] text-slate-400 italic">
                      -
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

                      return (
                        <div
                          key={s.id}
                          onClick={() => handleOpenRoster(s.id)}
                          className="cursor-pointer rounded-2xl border border-slate-100 bg-slate-50 p-2.5 shadow-2xs transition hover:-translate-y-0.5 hover:shadow-xs dark:border-slate-800 dark:bg-slate-800/60"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: s.class_type.color }}
                            />
                            <h4 className="font-bold text-xs truncate text-slate-900 dark:text-slate-100">
                              {s.class_type.name}
                            </h4>
                          </div>

                          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>
                              {startTime} - {endTime}
                            </span>
                          </div>

                          {s.instructor && (
                            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              <User className="h-3 w-3 shrink-0" />
                              <span className="truncate">{s.instructor.name}</span>
                            </div>
                          )}

                          <div className="mt-2 flex items-center justify-between text-[10px]">
                            <span
                              className={`rounded-full px-2 py-0.5 font-semibold ${
                                isFull
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}
                            >
                              {s.booked_count}/{s.max_capacity}
                            </span>

                            {s.waitlisted_count > 0 && (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                +{s.waitlisted_count} {t('classes.status_waitlisted', 'chờ')}
                              </span>
                            )}
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
      ) : view === 'day' ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
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

                return (
                  <div
                    key={s.id}
                    onClick={() => handleOpenRoster(s.id)}
                    className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-slate-100/70 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/80"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full"
                        style={{ backgroundColor: s.class_type.color }}
                      />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {s.class_type.name}
                        </h4>
                        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="h-3 w-3" />
                            {startTime} - {endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {s.instructor?.name || t('classes.unassigned', 'Chưa phân công')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {s.booked_count}/{s.max_capacity} {t('classes.spots', 'chỗ')}
                        </span>
                        {isFull && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            {t('classes.full_badge', 'Đủ chỗ')}
                          </span>
                        )}
                      </span>

                      {s.waitlisted_count > 0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
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
          onClose={() => {
            setIsEditorOpen(false)
            setEditingSchedule(undefined)
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
