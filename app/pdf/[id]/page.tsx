"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import PdfViewer from "@/components/PdfViewer"
import { useParams } from "next/navigation"

export default function PdfViewerPage() {
  const params = useParams() 
  const id = params?.id as string // Extract id safely
  const [pdfPath, setPdfPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchPdfPath() {
      if (!id) return
      const { data, error } = await supabase.from("pdf_files").select("path").eq("id", id).single()

      if (error) {
        console.error("Error fetching PDF path:", error)
        setError("Failed to load PDF")
      } else if (data) {
        setPdfPath(data.path)
      }
    }

    fetchPdfPath()
  }, [id, supabase])

  if (error) return <div>{error}</div>
  if (!pdfPath) return <div className="min-h-screen justify-center items-center flex">Loading...</div>

  return <PdfViewer pdfPath={pdfPath} />
}
