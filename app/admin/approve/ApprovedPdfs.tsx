"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SearchIcon, Trash2Icon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Image from "next/image"

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
  type: string
}

export default function ApprovedPdfs() {
  const [approvedPdfs, setApprovedPdfs] = useState<PdfFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  const supabase = createClient()

  const fetchApprovedPdfs = useCallback(async () => {
    setLoading(true)
    const { data, error, count } = await supabase
      .from("pdf_files")
      .select("*", { count: "exact" })
      .eq("status", "approved")
      .ilike("name", `%${searchTerm}%`)
      .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching approved documents:", error)
    } else {
      setApprovedPdfs(data as PdfFile[])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    }
    setLoading(false)
  }, [supabase, searchTerm, currentPage])

  useEffect(() => {
    fetchApprovedPdfs()

    const subscription = supabase
      .channel("pdf_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pdf_files" }, () => {
        fetchApprovedPdfs()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [fetchApprovedPdfs, supabase])

  async function handleDelete(id: string) {
    try {
      const { data: pdfData, error: fetchError } = await supabase.from("pdf_files").select("path").eq("id", id).single()

      if (fetchError) throw fetchError

      const { error: storageError } = await supabase.storage.from("pdfs").remove([pdfData.path])

      if (storageError) throw storageError

      const { error: deleteError } = await supabase.from("pdf_files").delete().eq("id", id)

      if (deleteError) throw deleteError

      await fetchApprovedPdfs()
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  if (loading) {
    return  <div className="flex flex-col items-center justify-center py-12">
              <Image
                src="/empty.jpg" 
                alt="No documents found"
                height={300} 
                width={300} 
                className="mb-6 opacity-75"
              />
              <p className="text-gray-500">No documents found matching your criteria.</p>
            </div>
  }

  return (
    <div>

      <div className="mb-4 flex items-center">
        <Input
          type="text"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
          className="mr-2"
        />
        <Button onClick={() => fetchApprovedPdfs()}>
          <SearchIcon className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>
      <div className="space-y-4">
        {approvedPdfs.map((pdf) => (
          <Card key={pdf.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {pdf.name}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you sure you want to delete this document?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete the document from the database.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {}}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={() => handleDelete(pdf.id)}>
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-1 text-sm">
              <p>Course: {pdf.course}</p>
              <p>Level: {pdf.level}</p>
              <p>Description: {pdf.description}</p>
              <p>Tags: {pdf.tags?.join(", ")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {approvedPdfs.length === 0 &&  <div className="flex flex-col items-center justify-center py-12">
                <Image 
                  src="/empty.jpg" 
                  alt="No documents found"
                  height={300} 
                  width={300} 
                  className="mb-6 opacity-75"
                />
                <p className="text-gray-500">No documents found matching your criteria.</p>
              </div>}
      <div className="flex justify-center mt-4 space-x-2">
        <Button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          Previous
        </Button>
        <span className="self-center">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

