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
  Menu as MenuIcon,
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
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()
  const { notifications } = useNotification()

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

  // Responsive: show overlay on mobile or when isOpen is true
  // Show static sidebar on desktop (md: block)
  return (
    <>
      {/* Topbar for mobile with menu button */}
      <div className="md:hidden flex items-center h-14 px-1 bg-white sticky top-0 z-40">
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
          <MenuIcon className="h-6 w-6" />
        </Button>
      </div>

      {/* Backdrop for overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar overlay on mobile, static on desktop */}
      <aside
        className={cn(
          "bg-white border-r min-h-screen flex flex-col transition-all duration-300",
          isOpen ? "w-64 fixed left-0 top-0 h-full z-50" : "hidden",
          "md:relative md:flex md:w-64 md:z-0"
        )}
        style={{ boxShadow: isOpen ? "0 0 0 9999px rgba(0,0,0,0.01)" : undefined }}
      >
        {/* Close button for overlay */}
        <div className="flex flex-col gap-2 p-4 border-b">
          <div className="flex items-center gap-3">
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
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(false)}
              aria-label="Close sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
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
        <nav className="flex-1 p-4 space-y-1 flex flex-col">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-gray-100"
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
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
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>
    </>
  )
} 