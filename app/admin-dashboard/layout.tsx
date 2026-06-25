"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const menuItems = [
  { label: "Dashboard", href: "/admin-dashboard", icon: "📊" },
  { label: "Farms", href: "/admin-dashboard/farms", icon: "🌾" },
  { label: "Predictions", href: "/admin-dashboard/predictions", icon: "🤖" },
  { label: "Sensors", href: "/admin-dashboard/sensors", icon: "📡" },
  { label: "Users", href: "/admin-dashboard/users", icon: "👥" },
  { label: "Reports", href: "/admin-dashboard/reports", icon: "📈" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-blue-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">🌾 AgriXplain</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-blue-700 rounded">
            {sidebarOpen ? "←" : "→"}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              title={sidebarOpen ? "" : item.label}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-blue-700">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-blue-900 bg-transparent"
            onClick={() => {
              window.location.href = "/login"
            }}
          >
            {sidebarOpen ? "Sign Out" : "⎋"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
