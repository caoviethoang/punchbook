import { downloadBlob } from "./api"

export async function downloadExcelReport(): Promise<void> {
  return downloadBlob("/reports/export", "punchbook_report.xlsx")
}
