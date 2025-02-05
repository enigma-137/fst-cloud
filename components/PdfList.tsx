"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Download, MoveLeft, MoveRightIcon } from "lucide-react"
import { toast } from "sonner"

interface PdfFile {
  id: string
  name: string
  created_at: string
  course: string
  level: string
  status: "pending" | "approved" | "rejected"
  path: string
  description: string
  tags: string[]
}

export default function PdfList() {
  const [pdfs, setPdfs] = useState<PdfFile[]>([])
  const [loading, setLoading] = useState(true)
  const [courseFilter, setCourseFilter] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(9)
  const [totalCount, setTotalCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    fetchPdfs()
  }, [currentPage, courseFilter, levelFilter, searchTerm])

  useEffect(() => {
    const subscription = supabase
      .channel("pdf_files_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pdf_files" }, (payload) => {
        console.log("Change received!", payload)
        fetchPdfs()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function fetchPdfs() {
    setLoading(true)
    let query = supabase
      .from("pdf_files")
      .select("*", { count: "exact" })
      .eq("status", "approved")
      .order("created_at", { ascending: false })

    if (courseFilter) {
      query = query.eq("course", courseFilter)
    }
    if (levelFilter) {
      query = query.eq("level", levelFilter)
    }
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
    }

    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage - 1

    const { data, error, count } = await query.range(start, end)

    if (error) {
      console.error("Error fetching PDFs:", error)
    } else {
      setPdfs(data as PdfFile[])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }

  const handleDownload = async (pdf: PdfFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('pdfs')
        .download(pdf.path)

      if (error) {
        throw error
      }

      // Create a URL for the downloaded file
      const url = window.URL.createObjectURL(data)
      
      // Create a temporary anchor element and trigger the download
      const a = document.createElement('a')
      a.href = url
      a.download = pdf.name.endsWith('.pdf') ? pdf.name : `${pdf.name}.pdf`
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download PDF')
    }
  }

  const courses = Array.from(new Set(pdfs.map((pdf) => pdf.course)))
  const levels = Array.from(new Set(pdfs.map((pdf) => pdf.level)))

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          type="text"
          placeholder="Search PDFs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select onValueChange={(value) => setCourseFilter(value === "all" ? null : value)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course} value={course}>
                {course}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => setLevelFilter(value === "all" ? null : value)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {levels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="min-h-[400px] flex justify-center items-center">
          <div className="animate-pulse text-gray-500">Loading PDFs...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdfs.map((pdf) => (
            <Card key={pdf.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-2">{pdf.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Course: {pdf.course}</p>
                  <p className="text-sm font-medium">Level: {pdf.level}</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{pdf.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pdf.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t">
                <Button 
                  onClick={() => handleDownload(pdf)}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {pdfs.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No PDFs found matching your criteria.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 py-4">
          <Button
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            <MoveLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            <MoveRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}