"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

export interface Notification {
  id: string
  message: string
  created_at: string
  type: "admin" | "user"
  pdfId?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAllAsRead: () => void
  addNotification: (notification: Notification) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider")
  return ctx
}

export function NotificationProvider({ children, user, isAdmin }: { children: React.ReactNode, user: User | null, isAdmin: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel("pdf_files_notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pdf_files" },
        (payload) => {
          const pdf = payload.new
          // Admin: notify for all new uploads
          if (isAdmin) {
            addNotification({
              id: pdf.id,
              message: `New PDF uploaded: ${pdf.name} (pending approval)`,
              created_at: pdf.created_at,
              type: "admin",
              pdfId: pdf.id,
            })
          } else if (pdf.user_id === user.id) {
            // User: notify only for their own uploads
            addNotification({
              id: pdf.id,
              message: `Your PDF "${pdf.name}" was uploaded and is pending approval`,
              created_at: pdf.created_at,
              type: "user",
              pdfId: pdf.id,
            })
          }
        }
      )
      .subscribe()
    return () => {
      channel.unsubscribe()
    }
    // eslint-disable-next-line
  }, [user, isAdmin])

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev])
    setUnreadCount((prev) => prev + 1)
  }

  const markAllAsRead = () => setUnreadCount(0)

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  )
} 