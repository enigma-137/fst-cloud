"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import {
  ArrowLeftCircleIcon,
  Trash2Icon,
  SearchIcon,
  Loader2Icon,
  LucideLoader2,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
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
}

export default function AdminApprove() {
  const [pendingPdfs, setPendingPdfs] = useState<PdfFile[]>([])
  const [approvedPdfs, setApprovedPdfs] = useState<PdfFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showApprovedPdfs, setShowApprovedPdfs] = useState(false)
  const itemsPerPage = 10
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
    }
  }, [supabase, router])

  useEffect(() => {
    checkAdminStatus()
  }, [checkAdminStatus])

  const fetchPendingPdfs = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    const { data, error } = await supabase
      .from("pdf_files")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      setError("Error fetching pending PDFs")
      console.error("Error fetching pending PDFs:", error)
    } else {
      setPendingPdfs(data as PdfFile[])
    }
    setLoading(false)
  }, [supabase, isAdmin])

  const fetchApprovedPdfs = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    const { data, error, count } = await supabase
      .from("pdf_files")
      .select("*", { count: "exact" })
      .eq("status", "approved")
      .ilike("name", `%${searchTerm}%`)
      .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)
      .order("created_at", { ascending: false })

    if (error) {
      setError("Error fetching approved PDFs")
      console.error("Error fetching approved PDFs:", error)
    } else {
      setApprovedPdfs(data as PdfFile[])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    }
    setLoading(false)
  }, [supabase, searchTerm, currentPage, isAdmin])

  useEffect(() => {
    if (isAdmin) {
      fetchPendingPdfs()
      fetchApprovedPdfs()
    }

    const subscription = supabase
      .channel("pdf_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pdf_files" }, () => {
        fetchPendingPdfs()
        fetchApprovedPdfs()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [fetchPendingPdfs, fetchApprovedPdfs, isAdmin, supabase])

  async function handleApproval(id: string, approved: boolean) {
    try {
      const { error } = await supabase
        .from("pdf_files")
        .update({ status: approved ? "approved" : "rejected" })
        .eq("id", id)

      if (error) throw error

      await fetchPendingPdfs()
      await fetchApprovedPdfs()
    } catch (error) {
      if (error instanceof Error) {
        setError(`Error updating PDF status: ${error.message}`)
      } else {
        setError("An unknown error occurred")
      }
      console.error("Error updating PDF status:", error)
    }
  }

  async function handleDelete(id: string) {
    try {
      // First, get the file path
      const { data: pdfData, error: fetchError } = await supabase.from("pdf_files").select("path").eq("id", id).single()

      if (fetchError) throw fetchError

      // Delete the file from storage
      const { error: storageError } = await supabase.storage.from("pdfs").remove([pdfData.path])

      if (storageError) throw storageError

      // Delete the database entry
      const { error: deleteError } = await supabase.from("pdf_files").delete().eq("id", id)

      if (deleteError) throw deleteError

      await fetchApprovedPdfs()
    } catch (error) {
      if (error instanceof Error) {
        setError(`Error deleting PDF: ${error.message}`)
      } else {
        setError("An unknown error occurred")
      }
      console.error("Error deleting PDF:", error)
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col  justify-center items-center">
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
          Loading <LucideLoader2 className="ml-2 h-4 w-4 animate-spin" />
        </h1>
      </div>
    )

  return (
    <div className="container mx-auto p-4">
      <Button onClick={() => router.push("/dashboard")}>
        <ArrowLeftCircleIcon className="mr-2 h-4 w-4" />
        Back
      </Button>
      <h1 className="text-2xl font-bold mb-4 text-center">Admin Page</h1>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <h2 className="text-xl font-semibold mb-2">Pending PDFs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

      <Button onClick={() => setShowApprovedPdfs(!showApprovedPdfs)} className="w-full mb-4">
        {showApprovedPdfs ? "Hide" : "View"} Approved PDFs
        {showApprovedPdfs ? <ChevronUpIcon className="ml-2 h-4 w-4" /> : <ChevronDownIcon className="ml-2 h-4 w-4" />}
      </Button>

      {showApprovedPdfs && (
        <>
          <h2 className="text-xl font-semibold mb-2">Approved PDFs</h2>
          <div className="mb-4 flex items-center">
            <Input
              type="text"
              placeholder="Search PDFs..."
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
                          <DialogTitle>Are you sure you want to delete this PDF?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently delete the PDF from the database.
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
                <CardContent>
                  <p>Course: {pdf.course}</p>
                  <p>Level: {pdf.level}</p>
                  <p>Description: {pdf.description}</p>
                  <p>Tags: {pdf.tags?.join(", ")}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {approvedPdfs.length === 0 && <p className="text-center">No approved PDFs found.</p>}
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
        </>
      )}
    </div>
  )
}

