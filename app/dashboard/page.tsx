"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import PdfUpload from "@/components/PdfUpload"
import PdfList from "@/components/PdfList"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Dashboard</h1>
      {isAdmin && (
        <div className="mb-4">
          <Link href="/admin/approve">
            <Button>Go to Approval Page</Button>
          </Link>
        </div>
      )}
      <div className="mb-8">
        {/* <h2 className="text-xl font-semibold mb-2">Upload New PDF</h2> */}
        <PdfUpload />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Approved PDFs</h2>
        <PdfList />
      </div>
    </div>
  )
}
