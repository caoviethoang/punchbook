import QRCode from "qrcode"
import type { Membership, MembershipDetail } from "./memberships"
import { remainingLabel } from "./formatters"

export interface DigitalCardDownloadOptions {
  membership: Membership | MembershipDetail
  shopName?: string
}

/** Generates base64 PNG data URL of the QR code using offline qrcode library. */
export async function generateQRCodeDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    width: 320,
    margin: 1,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  })
}

/**
 * Draws the digital membership card with shop name, logo, customer name,
 * and unique QR code onto a canvas, exporting it as a downloadable PNG image.
 */
export async function downloadMembershipCardPng({
  membership,
  shopName,
}: DigitalCardDownloadOptions): Promise<void> {
  const qrValue = membership.qr_code_value || `PUNCHBOOK:${membership.id}`
  const qrDataUrl = await generateQRCodeDataUrl(qrValue)

  const effectiveShopName = membership.shop?.name || shopName || "PunchBook Spa"
  const customerName = membership.customer_name || "Hội viên"
  const phone = membership.phone || ""
  const packageName = membership.package?.name || "Gói dịch vụ"
  const remainingText = remainingLabel(membership)

  // Setup high-res canvas (width: 600, height: 860)
  const canvas = document.createElement("canvas")
  const width = 600
  const height = 860
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")
  if (!ctx) return

  // 1. Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, "#1e1b4b") // deep indigo-950
  bgGrad.addColorStop(0.5, "#0f172a") // slate-900
  bgGrad.addColorStop(1, "#020617") // slate-950

  // Draw rounded card background
  const radius = 32
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.lineTo(width - radius, 0)
  ctx.quadraticCurveTo(width, 0, width, radius)
  ctx.lineTo(width, height - radius)
  ctx.quadraticCurveTo(width, height, width - radius, height)
  ctx.lineTo(radius, height)
  ctx.quadraticCurveTo(0, height, 0, height - radius)
  ctx.lineTo(0, radius)
  ctx.quadraticCurveTo(0, 0, radius, 0)
  ctx.closePath()
  ctx.clip()

  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // Decorative subtle circle glow
  const glowGrad = ctx.createRadialGradient(width, 0, 50, width, 0, 350)
  glowGrad.addColorStop(0, "rgba(99, 102, 241, 0.25)")
  glowGrad.addColorStop(1, "rgba(99, 102, 241, 0)")
  ctx.fillStyle = glowGrad
  ctx.fillRect(0, 0, width, height)

  // Decorative border
  ctx.strokeStyle = "rgba(99, 102, 241, 0.35)"
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()

  // 2. Header Brand Section
  // Draw PunchBook Ticket/Spark Logo
  ctx.save()
  const logoX = 48
  const logoY = 46

  // Logo Icon Background Box
  ctx.fillStyle = "#4f46e5"
  ctx.beginPath()
  ctx.roundRect(logoX, logoY, 44, 44, 12)
  ctx.fill()

  // Logo Icon Symbol (Card / Punch Holes)
  ctx.fillStyle = "#ffffff"
  ctx.beginPath()
  ctx.roundRect(logoX + 10, logoY + 10, 24, 24, 6)
  ctx.fill()
  ctx.fillStyle = "#4f46e5"
  ctx.beginPath()
  ctx.arc(logoX + 22, logoY + 22, 4, 0, Math.PI * 2)
  ctx.fill()

  // Brand Name
  ctx.fillStyle = "#a5b4fc"
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif"
  ctx.fillText("PUNCHBOOK", logoX + 56, logoY + 20)

  // Shop Name
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 20px system-ui, -apple-system, sans-serif"
  ctx.fillText(effectiveShopName.slice(0, 30), logoX + 56, logoY + 42)

  // Top Right Badge
  const badgeText = "THẺ HỘI VIÊN"
  ctx.font = "bold 11px system-ui, -apple-system, sans-serif"
  const badgeWidth = ctx.measureText(badgeText).width + 20
  const badgeX = width - 48 - badgeWidth
  ctx.fillStyle = "rgba(99, 102, 241, 0.25)"
  ctx.beginPath()
  ctx.roundRect(badgeX, logoY + 10, badgeWidth, 24, 12)
  ctx.fill()
  ctx.strokeStyle = "rgba(165, 180, 252, 0.4)"
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = "#e0e7ff"
  ctx.fillText(badgeText, badgeX + 10, logoY + 26)
  ctx.restore()

  // Divider Line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(48, 116)
  ctx.lineTo(width - 48, 116)
  ctx.stroke()

  // 3. QR Code Section (White Container)
  const qrBoxSize = 270
  const qrBoxX = (width - qrBoxSize) / 2
  const qrBoxY = 144

  ctx.save()
  // White Box Shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 12
  ctx.fillStyle = "#ffffff"
  ctx.beginPath()
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 20)
  ctx.fill()
  ctx.restore()

  // Draw QR Image into box
  await new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      ctx.drawImage(img, qrBoxX + 15, qrBoxY + 15, qrBoxSize - 30, qrBoxSize - 30)
      resolve()
    }
    img.onerror = reject
    img.src = qrDataUrl
  })

  // Under QR hint
  ctx.fillStyle = "#94a3b8"
  ctx.font = "12px system-ui, -apple-system, sans-serif"
  ctx.textAlign = "center"
  ctx.fillText("Quét mã QR để điểm danh tức thì", width / 2, qrBoxY + qrBoxSize + 30)

  // 4. Member Information Section
  const infoStartY = 485

  // Customer Name
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 26px system-ui, -apple-system, sans-serif"
  ctx.textAlign = "center"
  ctx.fillText(customerName, width / 2, infoStartY)

  // Phone
  ctx.fillStyle = "#cbd5e1"
  ctx.font = "600 16px ui-monospace, SFMono-Regular, Menlo, monospace"
  ctx.fillText(phone, width / 2, infoStartY + 30)

  // Package & Status Card Box
  const pkgBoxW = 440
  const pkgBoxH = 80
  const pkgBoxX = (width - pkgBoxW) / 2
  const pkgBoxY = infoStartY + 56

  ctx.fillStyle = "rgba(255, 255, 255, 0.05)"
  ctx.beginPath()
  ctx.roundRect(pkgBoxX, pkgBoxY, pkgBoxW, pkgBoxH, 16)
  ctx.fill()
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
  ctx.lineWidth = 1
  ctx.stroke()

  // Package Name
  ctx.textAlign = "left"
  ctx.fillStyle = "#818cf8"
  ctx.font = "bold 15px system-ui, -apple-system, sans-serif"
  ctx.fillText(packageName, pkgBoxX + 24, pkgBoxY + 34)

  // Remaining sessions or days
  ctx.fillStyle = "#ffffff"
  ctx.font = "600 14px system-ui, -apple-system, sans-serif"
  ctx.fillText(remainingText, pkgBoxX + 24, pkgBoxY + 58)

  // Member ID
  ctx.textAlign = "center"
  ctx.fillStyle = "#64748b"
  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace"
  ctx.fillText(`Mã thẻ: ${membership.id}`, width / 2, pkgBoxY + pkgBoxH + 40)

  // 5. Footer Branding
  ctx.fillStyle = "#475569"
  ctx.font = "11px system-ui, -apple-system, sans-serif"
  ctx.fillText("PunchBook Digital Membership Card", width / 2, height - 36)

  // 6. Trigger Browser Download
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const safeCustomer = customerName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
    a.download = `the-hoi-vien-${safeCustomer || "card"}.png`
    a.href = url
    a.click()
    URL.revokeObjectURL(url)
  }, "image/png")
}
