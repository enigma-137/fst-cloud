"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import Sidebar from "@/components/Sidebar"
import { NotificationProvider } from "@/components/NotificationContext"
import type { User } from "@supabase/supabase-js"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) {
        window.location.href = "/login"
        return
      }
      const { data } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
      setIsAdmin(!!data)
      setLoading(false)
    }
    checkAdminStatus()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <NotificationProvider user={user} isAdmin={isAdmin}>
      <div className="flex h-screen w-screen overflow-hidden">
        {/* Fixed Sidebar */}
        <div className="fixed left-0 top-0 h-screen z-50">
          <Sidebar isAdmin={isAdmin} />
        </div>
        {/* Main Content (scrollable) */}
        <main className="flex-1 flex flex-col h-screen ml-0 md:ml-64 overflow-hidden">
          {children}
        </main>
      </div>
    </NotificationProvider>
  )
} 