"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import PdfUpload from "@/components/PdfUpload"
import PdfList from "@/components/PdfList"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { User } from "lucide-react"

export default function Dashboard() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const checkAdminStatus = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("No user found")
      setLoading(false)
      return
    }

    console.log("User ID:", user.id) // Debugging user ID

    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle() // Prevents crash if no result

    console.log("Admin check result:", data, error)

    setIsAdmin(!!data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    checkAdminStatus()
  }, [checkAdminStatus])

  if (loading) return <div className="min-h-screen flex justify-center items-center">Loading...</div>

  return (
<div className="container mx-auto px-4 py-8 max-w-4xl">
      {isAdmin && (
        <div className="flex md:justify-start mb-6">
          <Link href="/admin/approve">
            <Button className="w-full md:w-auto">Admin <User className="ml-2 h-3 w-3 inline"/></Button>
          </Link>
        </div>
      )}
      
      <div className="space-y-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4"></h2>
          <PdfUpload />
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4">PDF List</h2>
          <PdfList />
        </div>
      </div>
    </div>
  )
}
