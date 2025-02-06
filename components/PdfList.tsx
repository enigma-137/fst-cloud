"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Download, Loader2Icon, BookOpen, Calendar, Tag } from "lucide-react"
import Image from "next/image"
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

// Function to get random color for tags
const getTagColor = (tag: string) => {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-yellow-100 text-yellow-700',
    'bg-indigo-100 text-indigo-700'
  ]
  const hash = tag.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0)
  return colors[hash % colors.length]
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

      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = pdf.name.endsWith('.pdf') ? pdf.name : `${pdf.name}.pdf`
      document.body.appendChild(a)
      a.click()
      
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
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2Icon className="h-5 w-5 animate-spin" />
            <span>Loading PDFs...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdfs.map((pdf) => (
            <Card key={pdf.id} className="flex flex-col hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold line-clamp-1 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  {pdf.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(pdf.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50">
                        Course: {pdf.course}
                      </Badge>
                      <Badge variant="outline" className="bg-purple-50">
                        Level {pdf.level}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{pdf.description}</p>
                  {pdf.tags && pdf.tags.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Tag className="h-4 w-4 text-gray-400 mt-1" />
                      <div className="flex flex-wrap gap-1">
                        {pdf.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t">
                <Button 
                  onClick={() => handleDownload(pdf)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
        <div className="flex flex-col items-center justify-center py-12">
          <Image 
            src="/empty.jpg" 
            alt="No PDFs found" 
            height={300} 
            width={300} 
            className="mb-6 opacity-75"
          />
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
            Previous
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
            Next
          </Button>
        </div>
      )}
    </div>
  )
}