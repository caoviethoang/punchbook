import { apiBaseUrl, authHeaders } from "./api"

export async function downloadExcelReport(): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/reports/export`, {
    headers: authHeaders(),
  })

  if (!response.ok) {
    let errorMessage = "Không thể tải báo cáo Excel."
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) errorMessage = data.error
    } catch {
      // non-JSON response
    }
    throw new Error(errorMessage)
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get("Content-Disposition")
  let filename = "punchbook_report.xlsx"
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/)
    if (match && match[1]) {
      filename = match[1]
    }
  }

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

