"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Download, Loader2Icon, Calendar, Tag, FolderOpen, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { AuthModal } from "./AuthModal"
// import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import FavoriteButton from "./FavoriteButton"
import type { User } from "@supabase/supabase-js"

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
  const [user, setUser] = useState<User | null>(null)

  // const [selectedPdf, setSelectedPdf] = useState<PdfFile | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

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

  const handleView = async (pdf: PdfFile) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setIsAuthModalOpen(true)
      return
    }
    try {
      const { data, error } = await supabase.storage.from("pdfs").createSignedUrl(pdf.path, 3600)
      if (error) throw error
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank")
      } else {
        toast.error("Could not get PDF link.")
      }
    } catch (err) {
      toast.error("Could not open PDF.")
    }
  }

//  const fileColor = "text-blue-600"
  // const handleTakeQuiz = async (pdf: PdfFile) => {
  //   const {
  //     data: { session },
  //   } = await supabase.auth.getSession()

  //   if (!session) {
  //     setIsAuthModalOpen(true)
  //     return
  //   }

  //   setSelectedPdf(pdf)
  //   setIsQuizModalOpen(true)
  // }

  return (
    <div className="container mx-auto px-1 py-4 space-y-4">
      {/* Responsive filter/search bar */}
      <div className="flex flex-col gap-2 md:flex-row md:space-x-2 md:gap-0">
        <Input
          type="text"
          placeholder="Search PDFs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-sm px-2 py-1"
        />
        <div className="flex flex-col gap-2 w-full md:flex-row md:gap-0 md:w-auto">
          <Select onValueChange={(value) => setCourseFilter(value === "all" ? null : value)}>
            <SelectTrigger className="w-full md:w-[120px] text-xs px-2 py-1">
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course} value={course} className="text-xs">
                  {course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => setLevelFilter(value === "all" ? null : value)}>
            <SelectTrigger className="w-full md:w-[100px] text-xs px-2 py-1">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {levels.map((level) => (
                <SelectItem key={level} value={level} className="text-xs">
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {loading ? (
        <div className="min-h-[200px] flex justify-center items-center">
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading PDFs...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pdfs.map((pdf) => (
            <Card key={pdf.id} className="flex flex-col hover:shadow-md transition-shadow duration-200 rounded-lg p-2">
              <CardHeader className="pb-2 px-2">
                <CardTitle className="text-xs font-semibold line-clamp-1 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <FolderOpen fill="green" fillOpacity="0.8" className="h-7 w-7 text-green-700 flex-shrink-0" />
                    <span className="text-xs font-semibold line-clamp-1">{pdf.name}</span>
                  </div>
                  {user && <FavoriteButton pdfId={pdf.id} userId={user.id} />}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-2 px-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span>Added: {new Date(pdf.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="bg-blue-50 text-xs px-2 py-0.5">
                        Course: {pdf.course}
                      </Badge>
                      <Badge variant="outline" className="bg-purple-50 text-xs px-2 py-0.5">
                        Level {pdf.level}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{pdf.description}</p>
                  {pdf.tags && pdf.tags.length > 0 && (
                    <div className="flex items-start gap-1">
                      <Tag className="h-3 w-3 text-gray-400 mt-0.5" />
                      <div className="flex flex-wrap gap-0.5">
                        {pdf.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getTagColor(tag)}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t flex flex-row justify-between gap-1 px-2">

                  <Button
                 
                  onClick={() => handleView(pdf)}
                  className=" text-xs py-1 h-8 min-h-0 mt-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  View
                  <BookOpen className="h-3 w-3 inline ml-1"/>
                </Button>
                <Button onClick={() => handleDownload(pdf)}  variant="outline" className="  text-xs py-1 h-8 min-h-0">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {pdfs.length === 0 || !loading  && <p className="text-center mt-8 text-xs">No PDFs found.</p>}
      <div className={`flex justify-center space-x-2 mt-2 ${pdfs.length === 0 || loading ? "hidden" : "block"}`}>
        <Button onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))} disabled={currentPage === 1} className="text-xs px-3 py-1 h-8 min-h-0">
          Previous
        </Button>
        <span className="text-xs self-center">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="text-xs px-3 py-1 h-8 min-h-0"
        >
          Next
        </Button>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}
