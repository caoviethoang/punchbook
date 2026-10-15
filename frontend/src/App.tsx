import { useState } from "react"
import { AppHeader, type AppView } from "./components/AppHeader"
import { CheckInScreen } from "./components/CheckInScreen"
import { DashboardScreen } from "./components/DashboardScreen"
import { LoginScreen } from "./components/LoginScreen"
import { MembershipsScreen } from "./components/MembershipsScreen"
import { PackagesScreen } from "./components/PackagesScreen"
import { SettingsScreen } from "./components/SettingsScreen"
import { useAppAuth } from "./hooks/useAppAuth"

function App() {
  const { shop, setShop, staff, authLoading, handleLogout, handleAuthSuccess } =
    useAppAuth()
  const [view, setView] = useState<AppView>("dashboard")

  const isAdmin = !staff || staff.role === "admin"
  const activeView =
    !isAdmin &&
    (view === "dashboard" || view === "settings" || view === "packages")
      ? "checkin"
      : view

  const onLogout = () => {
    handleLogout()
    setView("dashboard")
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <LoginScreen onSuccess={(s, st) => handleAuthSuccess(s, st)} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <AppHeader
        shop={shop}
        staff={staff}
        activeView={activeView}
        onSelectView={setView}
        onLogout={onLogout}
      />

      <main className="mx-auto max-w-5xl px-4 py-6">
        {activeView === "dashboard" ? (
          <DashboardScreen currentStaff={staff} />
        ) : activeView === "checkin" ? (
          <CheckInScreen
            currentStaff={staff}
            currentStaffId={staff?.id}
            shopName={shop.name}
            shopAddress={shop.address}
            shopPhone={shop.phone}
          />
        ) : activeView === "members" ? (
          <MembershipsScreen shop={shop} currentStaff={staff} />
        ) : activeView === "packages" ? (
          <PackagesScreen currentStaff={staff} />
        ) : (
          <SettingsScreen
            shop={shop}
            currentStaff={staff}
            onShopUpdated={setShop}
          />
        )}
      </main>
    </div>
  )
}

export default App
