"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Download, Loader2Icon, BookOpen, Calendar, Tag, BookX, SlidersHorizontal, Search } from "lucide-react"
import { toast } from "sonner"
import { AuthModal } from "./AuthModal"
import Image from "next/image"

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
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-yellow-100 text-yellow-700",
    "bg-indigo-100 text-indigo-700",
  ]
  const hash = tag.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0)
  return colors[hash % colors.length]
}

export default function PdfList() {
  const [pdfs, setPdfs] = useState<PdfFile[]>([])
  const [allPdfs, setAllPdfs] = useState<PdfFile[]>([])
  const [loading, setLoading] = useState(true)
  const [courseFilter, setCourseFilter] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(9)
  const [totalCount, setTotalCount] = useState(0)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [filterView, setFilterView] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchPdfs()
  }, [currentPage, courseFilter, levelFilter, searchTerm]) //This line was flagged as needing fewer dependencies

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
    try {
      const { data, error } = await supabase
        .from("pdf_files")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })

      if (error) throw error

      let filteredPdfs = data as PdfFile[]

      if (courseFilter) {
        filteredPdfs = filteredPdfs.filter((pdf) => pdf.course.toLowerCase().startsWith(courseFilter.toLowerCase()))
      }
      if (levelFilter) {
        filteredPdfs = filteredPdfs.filter((pdf) => pdf.level === levelFilter)
      }
      if (searchTerm) {
        filteredPdfs = filteredPdfs.filter(
          (pdf) =>
            pdf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pdf.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pdf.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
        )
      }

      setTotalCount(filteredPdfs.length)
      const start = (currentPage - 1) * itemsPerPage
      const end = start + itemsPerPage
      setPdfs(filteredPdfs.slice(start, end))
      setAllPdfs(data as PdfFile[])
    } catch (error) {
      console.error("Error fetching PDFs:", error)
    } finally {
      setLoading(false)
    }
  }

  const courses = Array.from(new Set(allPdfs.map((pdf) => pdf.course.substring(0, 3)))).sort()
  const levels = Array.from(new Set(allPdfs.map((pdf) => pdf.level)))

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const handleDownload = async (pdf: PdfFile) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setIsAuthModalOpen(true)
      return
    }

    try {
      const { data, error } = await supabase.storage.from("pdfs").download(pdf.path)

      if (error) {
        throw error
      }

      const url = window.URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = pdf.name.endsWith(".pdf") ? pdf.name : `${pdf.name}.pdf`
      document.body.appendChild(a)
      a.click()

      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("PDF downloaded successfully")
    } catch (error) {
      console.error("Error downloading file:", error)
      toast.error("Failed to download PDF")
    }
  }

  return (
    <div className="container mx-auto px-1 py-8 space-y-6">
    {/* Search & Filters */}
    <div className="flex flex-col md:flex-row justify-between gap-4">
      {/* Search Bar */}
      <div className="relative w-full md:w-auto">
        <Search className="absolute right-2 opacity-20 top-2" />
        <Input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-auto pl-8"
        />
      </div>
  
      {/* Filters */}
      <div className="flex justify-end items-center">
        {/* Toggle Button */}
        <Button onClick={() => setFilterView(!filterView)} className="flex items-center mr-2"> 
          <SlidersHorizontal/>
        </Button>
  
        {/* Filters (Show when filterView is true) */}
        {filterView && (
          <div className="flex flex-wrap gap-3 md:ml-3">
            {/* Course Filter */}
            <Select onValueChange={(value) => setCourseFilter(value === "all" ? null : value)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Course" />
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
  
            {/* Level Filter */}
            <Select onValueChange={(value) => setLevelFilter(value === "all" ? null : value)}>
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Level" />
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
        )}
      </div>
    </div>
  
    {/* Loading State */}
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
          <Card key={pdf.id} className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
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
                  <span>Added: {new Date(pdf.created_at).toLocaleDateString()}</span>
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
              <Button onClick={() => handleDownload(pdf)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    )}
  
    {/* Empty State */}
    {pdfs.length === 0 && (
      <div className="flex flex-col justify-center items-center pb-16">
        <Image src="/empty.jpg" alt="empty" width={740} height={740} className="h-80 w-80" />
        <p>
          No PDF found <BookX className="inline h-5 w-5" />
        </p>
      </div>
    )}
  
    {/* Pagination */}
    <div className="flex justify-center space-x-2 mt-4">
      <Button onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))} disabled={currentPage === 1}>
        Previous
      </Button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <Button onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))} disabled={currentPage === totalPages}>
        Next
      </Button>
    </div>
  
    {/* Authentication Modal */}
    <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
  </div>
  
  )
}

