import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createClassSchedules, updateClassSchedule, dateKey, type ClassSchedule, type ClassType } from '../../lib/classes'
import { fetchStaffs } from '../../lib/staffs'
import type { Staff } from '../../lib/auth'
import { toApiError } from '../../lib/errors'
import { Modal } from '../ui/Modal'
import { inputClass, labelClass, primaryClass } from './styles'

function localTime(date: Date) { return `${dateKey(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` }
export function ScheduleEditor({ types, schedule, initialDate, onClose, onSaved }: {
  types: ClassType[]; schedule?: ClassSchedule; initialDate?: Date; onClose: () => void; onSaved: () => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const [staffs, setStaffs] = useState<Staff[]>([])
  const [typeId, setTypeId] = useState(schedule?.class_type.id || types[0]?.id || '')
  const [instructor, setInstructor] = useState(schedule?.instructor?.id || '')
  const [start, setStart] = useState(() => localTime(schedule ? new Date(schedule.starts_at) : (initialDate || new Date(Date.now() + 86400000))))
  const [duration, setDuration] = useState(schedule ? (Date.parse(schedule.ends_at) - Date.parse(schedule.starts_at)) / 60000 : types[0]?.default_duration_minutes || 60)
  const [capacity, setCapacity] = useState(schedule?.max_capacity || types[0]?.default_capacity || 15)
  const [policy, setPolicy] = useState<'attendance' | 'booking'>(schedule?.credit_policy || 'attendance')
  const [hours, setHours] = useState(schedule?.cancellation_hours ?? 2)
  const [repeat, setRepeat] = useState(false)
  const [weekdays, setWeekdays] = useState<number[]>([new Date(start).getDay()])
  const [until, setUntil] = useState(() => dateKey(new Date(Date.now() + 28 * 86400000)))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { let active = true; void fetchStaffs().then(data => { if (active) setStaffs(data) }).catch(err => { if (active) setError(toApiError(err)) }); return () => { active = false } }, [])
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const date = new Date(start)
      const value = { class_type_id: typeId, instructor_id: instructor || null, starts_at: date.toISOString(), ends_at: new Date(date.getTime() + duration * 60000).toISOString(), max_capacity: capacity, credit_policy: policy, cancellation_hours: hours }
      if (schedule) await updateClassSchedule(schedule.id, value)
      else await createClassSchedules(value, repeat ? { until, weekdays, time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone } : undefined)
      await onSaved(); onClose()
    } catch (err) { setError(toApiError(err)) } finally { setBusy(false) }
  }
  return <Modal isOpen onClose={onClose} maxWidthClass="max-w-xl"><form onSubmit={e => void submit(e)} className="max-h-[85vh] space-y-4 overflow-y-auto p-6">
    <h2 className="pr-8 text-xl font-bold">{t(schedule ? 'classes.edit_class' : 'classes.new_class')}</h2>
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    <label className={labelClass}>{t('classes.type')}<select required value={typeId} className={inputClass} onChange={e => { setTypeId(e.target.value); const type = types.find(item => item.id === e.target.value); if (type) { setCapacity(type.default_capacity); setDuration(type.default_duration_minutes) } }}>{types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
    <label className={labelClass}>{t('classes.instructor')}<select value={instructor} className={inputClass} onChange={e => setInstructor(e.target.value)}><option value="">{t('classes.unassigned')}</option>{staffs.map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}</select></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={labelClass}>{t('classes.starts_at')}<input required type="datetime-local" className={inputClass} value={start} onChange={e => setStart(e.target.value)} /></label>
      <label className={labelClass}>{t('classes.duration')}<input required min={5} max={720} type="number" className={inputClass} value={duration} onChange={e => setDuration(+e.target.value)} /></label>
      <label className={labelClass}>{t('classes.capacity')}<input required min={1} max={500} type="number" className={inputClass} value={capacity} onChange={e => setCapacity(+e.target.value)} /></label>
      <label className={labelClass}>{t('classes.credit_policy')}<select className={inputClass} value={policy} onChange={e => setPolicy(e.target.value as typeof policy)}><option value="attendance">{t('classes.on_attendance')}</option><option value="booking">{t('classes.on_booking')}</option></select></label>
    </div>
    {policy === 'booking' && <label className={labelClass}>{t('classes.cancellation_hours')}<input required min={0} max={168} type="number" className={inputClass} value={hours} onChange={e => setHours(+e.target.value)} /></label>}
    {!schedule && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={repeat} onChange={e => setRepeat(e.target.checked)} />{t('classes.repeat')}</label>}
    {repeat && <fieldset className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"><legend className="text-sm">{t('classes.repeat_days')}</legend><div className="flex flex-wrap gap-3">{[1, 2, 3, 4, 5, 6, 0].map(day => <label key={day} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={weekdays.includes(day)} onChange={e => setWeekdays(e.target.checked ? [...weekdays, day] : weekdays.filter(item => item !== day))} />{new Date(2026, 10, 1 + day).toLocaleDateString(i18n.language, { weekday: 'short' })}</label>)}</div><label className={labelClass}>{t('classes.repeat_until')}<input required type="date" className={inputClass} value={until} onChange={e => setUntil(e.target.value)} /></label><p className="text-xs text-slate-500">{t('classes.repeat_hint')}</p></fieldset>}
    <button className={`${primaryClass} w-full`} disabled={busy || !typeId || (repeat && weekdays.length === 0)}>{t(busy ? 'classes.saving' : 'classes.save')}</button>
  </form></Modal>
}
