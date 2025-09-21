"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { ArrowLeftCircleIcon, Loader2Icon } from "lucide-react"
import Image from "next/image"
import PendingPdfs from "./PendingPdfs"
import ApprovedPdfs from "./ApprovedPdfs"

export default function AdminApprove() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showApproved, setShowApproved] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const checkAdminStatus = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      router.push("/login")
      return
    }

    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", session.user.id)
      .single()

    if (error || !adminUser) {
      router.push("/dashboard")
    } else {
      setIsAdmin(true)
      setError(null)
    }
    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    checkAdminStatus()
  }, [checkAdminStatus])

  if (!isAdmin) {
    return (
      <div className="flex flex-col justify-center items-center">
        <Image src="/access-denied.jpg" alt="No access" width={740} height={740} className="h-80 w-80" />
        <h1>
          Access Denied. Redirecting <Loader2Icon className="animate-spin inline ml-2 h-4 w-4" />
        </h1>
      </div>
    )
  }

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <h1>
          Loading <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />
        </h1>
      </div>
    )

  return (
    <div className="container mx-auto p-4">
      <Button onClick={() => router.push("/dashboard")}>
        <ArrowLeftCircleIcon className="mr-2 h-4 w-4" />
        Back
      </Button>
      {/* <h1 className="text-2xl font-bold mb-4 text-center">Admin Page</h1> */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center space-x-4 mt-8 mb-4">
        <Button onClick={() => setShowApproved(false)} variant={showApproved ? "outline" : "default"}>
          Pending Documents
        </Button>
        <Button onClick={() => setShowApproved(true)} variant={showApproved ? "default" : "outline"}>
          Approved Documents
        </Button>
      </div>

      {showApproved ? <ApprovedPdfs /> : <PendingPdfs />}
    </div>
  )
}

