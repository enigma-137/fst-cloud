"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import PdfUpload from "@/components/PdfUpload"
import PdfList from "@/components/PdfList"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2Icon, User } from "lucide-react"

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

  if (loading) return <div className="min-h-screen flex justify-center items-center"><h1>Loading <Loader2Icon className="ml-2 h-4 w-4 inline animate-spin"/></h1></div>

  return (
<div className="container mx-auto px-5 py-8 max-w-7xl">
      {isAdmin && (
        <div className="md:justify-start mb-6">
          <Link href="/admin/approve">
            <Button className="w-full md:w-auto">Admin <User className="ml-2 h-3 w-3 inline"/></Button>
          </Link>
        </div>
      )}
      
      <div className="space-y-8">
      
          <h2 className="text-lg md:text-xl font-semibold mb-4"></h2>
          <PdfUpload />

        
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4">Available PDFs</h2>
          <PdfList />
        </div>
      </div>
    </div>
  )
}
