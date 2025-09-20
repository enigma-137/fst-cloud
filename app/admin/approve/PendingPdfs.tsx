"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Loader2Icon } from "lucide-react"

interface PdfFile {
  id: string
  name: string
  created_at: string
  course: string
  level: string
  status: "pending" | "approved" | "rejected"
  description: string
  tags: string[]
  path: string
}

export default function PendingPdfs() {
  const [pendingPdfs, setPendingPdfs] = useState<PdfFile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchPendingPdfs = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("pdf_files")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching pending PDFs:", error)
    } else {
      setPendingPdfs(data as PdfFile[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchPendingPdfs()

    const subscription = supabase
      .channel("pdf_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pdf_files" }, () => {
        fetchPendingPdfs()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [fetchPendingPdfs, supabase])

  async function handleApproval(id: string, approved: boolean) {
    try {
      const { error } = await supabase
        .from("pdf_files")
        .update({ status: approved ? "approved" : "rejected" })
        .eq("id", id)

      if (error) throw error

      await fetchPendingPdfs()
    } catch (error) {
      console.error("Error updating PDF status:", error)
    }
  }

  if (loading) {
    return <div>Loading pending PDFs <Loader2Icon className="ml-2 h-4 w-4 inline animate-spin"/></div>
  }

  return (
    <div>
 
      <div className="grid grid-cols-1 md:grid-cols-2 p-2 lg:grid-cols-3 gap-4 mb-8">
        {pendingPdfs.map((pdf) => (
          <Card key={pdf.id}>
            <CardHeader>
              <CardTitle>{pdf.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Course: {pdf.course}</p>
              <p>Level: {pdf.level}</p>
              <p>Description: {pdf.description}</p>
              <p>Tags: {pdf.tags?.join(", ")}</p>
              <p>Status: {pdf.status}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => handleApproval(pdf.id, true)} className="bg-green-500 hover:bg-green-700">
                Approve
              </Button>
              <Button onClick={() => handleApproval(pdf.id, false)} variant="destructive">
                Reject
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {pendingPdfs.length === 0 && (
        <div className="flex flex-col items-center justify-center">
          <Image src="/empty.jpg" alt="image empty" height={740} width={740} className="h-80 w-80" />
          <p className="text-center mb-8">No pending PDFs to approve.</p>
        </div>
      )}
    </div>
  )
}

