"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Download, Loader2Icon, Calendar, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { AuthModal } from "./AuthModal"
import FavoriteButton from "./FavoriteButton"
import type { User } from "@supabase/supabase-js"
import Image from "next/image"

interface PdfFile {
  id: string
  name: string
  created_at: string
  course: string
  level: string
  status: "pending" | "approved" | "rejected"
  path: string
  type: string
  description: string
  tags: string[]
}

// const getTagColor = (tag: string) => {
//   const colors = [
//     "bg-blue-100 text-blue-700",
//     "bg-green-100 text-green-700",
//     "bg-purple-100 text-purple-700",
//     "bg-pink-100 text-pink-700",
//     "bg-yellow-100 text-yellow-700",
//     "bg-indigo-100 text-indigo-700",
//   ]
//   const hash = tag.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0)
//   return colors[hash % colors.length]
// }

export default function PdfList() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [pdfs, setPdfs] = useState<PdfFile[]>([])
  const [allPdfs, setAllPdfs] = useState<PdfFile[]>([])
  const [loading, setLoading] = useState(true)
  const [courseFilter, setCourseFilter] = useState<string | null>(searchParams.get('course') || null)
  const [levelFilter, setLevelFilter] = useState<string | null>(searchParams.get('level') || null)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [itemsPerPage] = useState(12)
  const [totalCount, setTotalCount] = useState(0)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchPdfs = useCallback(async () => {
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
            (pdf.name && pdf.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (pdf.description && pdf.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (pdf.course && pdf.course.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (pdf.tags && Array.isArray(pdf.tags) && pdf.tags.some((tag) => typeof tag === 'string' && tag.toLowerCase().includes(searchTerm.toLowerCase()))),
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
  }, [supabase, courseFilter, levelFilter, searchTerm, currentPage, itemsPerPage])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '')
    setCourseFilter(searchParams.get('course') || null)
    setLevelFilter(searchParams.get('level') || null)
    setCurrentPage(parseInt(searchParams.get('page') || '1'))
  }, [searchParams])

  useEffect(() => {
    fetchPdfs()
  }, [fetchPdfs])

  useEffect(() => {
    setCurrentPage(1)
  }, [courseFilter, levelFilter, searchTerm])

  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (courseFilter) params.set('course', courseFilter)
    if (levelFilter) params.set('level', levelFilter)
    if (currentPage > 1) params.set('page', currentPage.toString())
    router.replace(`/dashboard?${params.toString()}`, { scroll: false })
  }, [searchTerm, courseFilter, levelFilter, currentPage, router])

  useEffect(() => {
    const subscription = supabase
      .channel("pdf_files_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pdf_files" }, () => {
        fetchPdfs()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchPdfs])

  const courses = Array.from(new Set(allPdfs.map((pdf) => pdf.course.substring(0, 3)))).sort()
  const levels = Array.from(new Set(allPdfs.map((pdf) => pdf.level)))

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const handleDownload = async (pdf: PdfFile) => {
    if (!user) { setIsAuthModalOpen(true); return; }
    try {
      const { data, error } = await supabase.storage.from("pdfs").download(pdf.path)
      if (error) throw error
      const url = window.URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = pdf.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Downloaded successfully")
    } catch (error) {
      console.error(error)
      toast.error("Download failed")
    }
  }

  const handleView = async (pdf: PdfFile) => {
    if (!user) { setIsAuthModalOpen(true); return; }
    try {
      const { data, error } = await supabase.storage.from("pdfs").createSignedUrl(pdf.path, 3600)
      if (error) throw error
      window.open(data.signedUrl, "_blank")
    } catch (err) {
      console.error(err)
      toast.error("Could not open document")
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md flex flex-col items-center md:flex-row md:justify-center gap-4 p-4 border-b border-gray-100">
        <div className="relative w-full md:w-1/3 mt-8 md:mt-0">
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-xl border-gray-200 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select onValueChange={(value) => setCourseFilter(value === "all" ? null : value)}>
            <SelectTrigger className="w-full md:w-[140px] rounded-xl border-gray-200">
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course} value={course}>{course}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setLevelFilter(value === "all" ? null : value)}>
            <SelectTrigger className="w-full md:w-[140px] rounded-xl border-gray-200">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {levels.map((level) => (
                <SelectItem key={level} value={level}>Level {level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2Icon className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-gray-500 font-medium">Loading documents...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 pb-20">
            {pdfs.map((pdf) => (
              <Card key={pdf.id} className="group relative overflow-hidden border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white rounded-2xl">
                <CardContent className="p-5 flex flex-col h-full gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-xl group-hover:bg-red-100 transition-colors duration-300">
                      <Image
                        src="https://cdn-icons-png.flaticon.com/128/337/337946.png"
                        alt={pdf.name}
                        width={50}
                        height={50}
                        className="rounded-lg transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    {user && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <FavoriteButton pdfId={pdf.id} userId={user.id} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <h3 className="font-bold text-base text-gray-900 leading-tight line-clamp-2 min-h-[2.5rem]" title={pdf.name}>
                      {pdf.name}
                    </h3>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                        {pdf.course}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-wider">
                        Level {pdf.level}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                        {pdf.type}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2 mt-2 leading-relaxed italic border-l-2 border-gray-100 pl-2">
                      {pdf.description || "No description available"}
                    </p>

                    <div className="flex items-center text-[11px] text-gray-400 mt-3">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Added {new Date(pdf.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(pdf)}
                      className="h-10 text-xs font-bold rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border-none transition-all"
                    >
                      <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleView(pdf)}
                      className="h-10 text-xs font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-green-200 transition-all border-none"
                    >
                      <BookOpen className="h-4 w-4 mr-2" /> Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {!loading && pdfs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
            <BookOpen className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-sm font-medium">No documents found.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 p-8 bg-white border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-xl px-6 font-semibold"
            >
              Previous
            </Button>
            <span className="text-sm font-bold text-gray-600 px-4 py-2 bg-gray-50 rounded-lg">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-xl px-6 font-semibold"
            >
              Next
            </Button>
          </div>
        )}
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  )
}
