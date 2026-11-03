import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { deleteClassType, saveClassType, type ClassType } from '../../lib/classes'
import { toApiError } from '../../lib/errors'
import { Modal } from '../ui/Modal'
import { buttonClass, inputClass, labelClass, primaryClass } from './styles'

export function ClassTypeManager({ types, onClose, onSaved }: {
  types: ClassType[]; onClose: () => void; onSaved: () => Promise<void>
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState<ClassType | null>(null)
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', default_capacity: 15, default_duration_minutes: 60 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const reset = () => { setEditing(null); setForm({ name: '', description: '', color: '#6366f1', default_capacity: 15, default_duration_minutes: 60 }) }
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true); setError('')
    try { await action(); await onSaved(); reset() } catch (err) { setError(toApiError(err)) } finally { setBusy(false) }
  }
  return <Modal isOpen onClose={onClose} maxWidthClass="max-w-2xl">
    <div className="max-h-[85vh] overflow-y-auto p-6">
      <h2 className="pr-8 text-xl font-bold">{t('classes.types')}</h2>
      {error && <p role="alert" className="mt-3 text-sm text-red-500">{error}</p>}
      <div className="my-4 space-y-2">
        {types.map(type => <div key={type.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <span className="font-medium"><span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ backgroundColor: type.color }} />{type.name}</span>
          <div className="flex gap-2">
            <button className={buttonClass} disabled={busy} onClick={() => { setEditing(type); setForm({ ...type, description: type.description || '' }) }}>{t('common.edit')}</button>
            <button className={buttonClass} disabled={busy} onClick={() => { if (window.confirm(t('classes.delete_type_confirm'))) void run(() => deleteClassType(type.id)) }}>{t('common.delete')}</button>
          </div>
        </div>)}
      </div>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); void run(() => saveClassType(form, editing?.id)) }}>
        <label className={labelClass}>{t('classes.type_name')}<input required maxLength={100} className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
        <label className={labelClass}>{t('classes.color')}<input type="color" className={`${inputClass} h-10`} value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></label>
        <label className={labelClass}>{t('classes.capacity')}<input required type="number" min={1} max={500} className={inputClass} value={form.default_capacity} onChange={e => setForm({ ...form, default_capacity: +e.target.value })} /></label>
        <label className={labelClass}>{t('classes.duration')}<input required type="number" min={5} max={720} className={inputClass} value={form.default_duration_minutes} onChange={e => setForm({ ...form, default_duration_minutes: +e.target.value })} /></label>
        <label className={`${labelClass} sm:col-span-2`}>{t('classes.description')}<textarea className={inputClass} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className={primaryClass}>{t(editing ? 'classes.save' : 'classes.add_type')}</button>{editing && <button type="button" className={buttonClass} onClick={reset}>{t('common.cancel')}</button>}</div>
      </form>
    </div>
  </Modal>
}
