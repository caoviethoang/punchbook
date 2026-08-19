import type { InputHTMLAttributes } from "react"
import { cn } from "../../lib/utils"

export const FORM_CONTROL_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400"

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Appends a red asterisk after the label. */
  required?: boolean
  className?: string
}

/**
 * Reusable form field: a labelled input with consistent styling.
 * Replaces the inline `Field` in LoginScreen and the repeated label+input
 * patterns in MembershipCreateForm and PackageCreateForm.
 */
export function FormField({ label, required, className, ...inputProps }: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      <input className={cn(FORM_CONTROL_CLASS, className)} {...inputProps} />
    </label>
  )
}
