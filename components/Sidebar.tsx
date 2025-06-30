"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Star,
  User as UserIcon,
  LogOut,
  Home,
  ChevronLeft,
  ChevronRight,
  Bell,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useNotification } from "@/components/NotificationContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { User } from "@supabase/supabase-js"

interface SidebarProps {
  isAdmin: boolean
}

export default function Sidebar({ isAdmin }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()
  const { notifications, unreadCount, markAllAsRead } = useNotification()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Favorites",
      href: "/favorites",
      icon: Star,
    },
    // {
    //   title: "Upload PDF",
    //   href: "/dashboard",
    //   icon: Upload,
    // },
    // {
    //   title: "Documents",
    //   href: "/dashboard",
    //   icon: BookOpen,
    // },
    ...(isAdmin
      ? [
          {
            title: "Admin Panel",
            href: "/admin/approve",
            icon: UserIcon,
          },
        ]
      : []),
    // {
    //   title: "Settings",
    //   href: "/settings",
    //   icon: Settings,
    // },
  ]

  return (
    <div
      className={cn(
        "relative min-h-screen bg-white border-r transition-all duration-300",
        isCollapsed ? "w-5" : "w-64"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-4 top-6 z-50 bg-white border rounded-full shadow-md"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      <div className="flex flex-col h-full">
        {/* User Profile Section */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
           
            {!isCollapsed && (
              <>
               <Avatar>
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.user_metadata?.full_name ||
                    (user?.email
                      ? user.email.split("@")[0].charAt(0).toUpperCase() + user.email.split("@")[0].slice(1)
                      : "")
                  }
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
              </div>
           </> )}
          </div>
          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative ml-2"
            onClick={() => { setNotifOpen(true); markAllAsRead(); }}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 ml-8" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>

        {/* Notification Center Modal */}
        <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Notifications</DialogTitle>
            </DialogHeader>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {notifications.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-4">No notifications yet.</div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="bg-gray-50 border rounded p-2 text-xs">
                    <div>{notif.message}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-1 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-gray-100"
                )}
              >
                <item.icon className="h-5 w-5" />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </div>
    </div>
  )
} 