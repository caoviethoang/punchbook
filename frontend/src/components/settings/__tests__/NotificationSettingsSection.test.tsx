import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import { NotificationSettingsSection } from "../NotificationSettingsSection"
import type { Shop } from "../../../lib/auth"
import * as settingsApi from "../../../lib/settings"
import * as notificationsApi from "../../../lib/notifications"

vi.mock("../../../lib/settings", () => ({
  updateShopProfile: vi.fn(),
}))

vi.mock("../../../lib/notifications", () => ({
  fetchNotificationLogs: vi.fn(),
  sendTestNotification: vi.fn(),
}))

describe("NotificationSettingsSection", () => {
  const onToast = vi.fn()
  const onShopUpdated = vi.fn()

  const mockShop: Shop = {
    id: "shop-1",
    name: "Gym Test",
    phone: "0901234567",
    email: "owner@gym.vn",
    plan: "pro",
    email_notifications_enabled: true,
    sms_notifications_enabled: false,
    zalo_notifications_enabled: true,
  }

  const mockLogs: notificationsApi.NotificationLog[] = [
    {
      id: "log-1",
      shop_id: "shop-1",
      channel: "email",
      event_type: "welcome",
      recipient: "member@example.com",
      status: "sent",
      error_message: null,
      sent_at: "2026-11-02T10:00:00Z",
      created_at: "2026-11-02T10:00:00Z",
    },
    {
      id: "log-2",
      shop_id: "shop-1",
      channel: "sms",
      event_type: "expiring_reminder",
      recipient: "0912345678",
      status: "failed",
      error_message: "Carrier timeout",
      sent_at: "2026-11-02T11:00:00Z",
      created_at: "2026-11-02T11:00:00Z",
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(notificationsApi.fetchNotificationLogs).mockResolvedValue({
      notification_logs: mockLogs,
      meta: { total: 2, page: 1, per_page: 10, total_pages: 1 },
    })
  })

  afterEach(() => {
    cleanup()
  })

  it("renders notification settings section with toggles and delivery logs", async () => {
    render(
      <NotificationSettingsSection
        shop={mockShop}
        isAdmin={true}
        onShopUpdated={onShopUpdated}
        onToast={onToast}
      />
    )

    expect(screen.getByText("Cấu hình Thông báo Đa kênh (Multi-channel Notifications)")).toBeInTheDocument()
    expect(screen.getByText("Thông báo qua Email (Khuyên dùng)")).toBeInTheDocument()
    expect(screen.getByText("Thông báo qua SMS Gateway (eSMS / SpeedSMS)")).toBeInTheDocument()
    expect(screen.getByText("Thông báo Zalo ZNS (Zalo Notification Service)")).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("member@example.com")).toBeInTheDocument()
      expect(screen.getByText("0912345678")).toBeInTheDocument()
      expect(screen.getByText("Carrier timeout")).toBeInTheDocument()
    })
  })

  it("updates notification toggle when toggled by admin", async () => {
    vi.mocked(settingsApi.updateShopProfile).mockResolvedValue({
      shop: { ...mockShop, sms_notifications_enabled: true },
    })

    render(
      <NotificationSettingsSection
        shop={mockShop}
        isAdmin={true}
        onShopUpdated={onShopUpdated}
        onToast={onToast}
      />
    )

    const smsCheckbox = screen.getByLabelText("Toggle SMS notifications")
    fireEvent.click(smsCheckbox)

    await waitFor(() => {
      expect(settingsApi.updateShopProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          sms_notifications_enabled: true,
        })
      )
      expect(onToast).toHaveBeenCalledWith("Cập nhật cấu hình thông báo thành công", "success")
    })
  })

  it("opens test modal and sends test notification", async () => {
    vi.mocked(notificationsApi.sendTestNotification).mockResolvedValue({
      message: "Gửi thông báo thử nghiệm thành công!",
      result: {},
    })

    render(
      <NotificationSettingsSection
        shop={mockShop}
        isAdmin={true}
        onShopUpdated={onShopUpdated}
        onToast={onToast}
      />
    )

    const testBtn = screen.getByText("Gửi thông báo thử nghiệm")
    fireEvent.click(testBtn)

    expect(screen.getByText("Gửi thử ngay")).toBeInTheDocument()

    const submitBtn = screen.getByText("Gửi thử ngay")
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(notificationsApi.sendTestNotification).toHaveBeenCalledWith({
        channel: "email",
        recipient: "owner@gym.vn",
      })
      expect(onToast).toHaveBeenCalledWith("Đã gửi thông báo thử nghiệm thành công!", "success")
    })
  })
})
