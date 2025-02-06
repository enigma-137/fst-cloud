"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Loader2Icon } from "lucide-react"
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

  const courses = Array.from(new Set(pdfs.map((pdf) => pdf.course)))
  const levels = Array.from(new Set(pdfs.map((pdf) => pdf.level)))

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="space-y-4">
           <div>
        <Input
          type="text"
          placeholder="Search PDFs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        </div>
      <div className="flex space-x-4">  
        <Select onValueChange={(value) => setCourseFilter(value === "all" ? null : value)}>
          <SelectTrigger className="w-[180px]">
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
          <SelectTrigger className="w-[180px]">
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
        <p>Loading PDFs <Loader2Icon className="ml-2 h-4 w-4 animate-spin inline"/></p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pdfs.map((pdf) => (
            <Card key={pdf.id}>
              <CardHeader>
                <CardTitle>{pdf.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Course: {pdf.course}</p>
                <p>Level: {pdf.level}</p>
                <p className="mt-2">{pdf.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {pdf.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  )) || " "}
                </div>
                {/* <Badge variant={pdf.status === "approved" ? "default" : "secondary"}>{pdf.status}</Badge> */}
              </CardContent>
              <CardFooter>
                <Link href={`/pdf/${pdf.id}`}>
                  <Button>View PDF</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {pdfs.length === 0 && <div className="flex flex-col items-center justify-center">
               <Image src="/empty.jpg" alt="image empty" height={740} width={740}  className="h-80 w-80"/><p className="text-center mb-8">No pending PDFs to approve.</p></div> 
               
               }
      <div className="flex justify-center space-x-2 bottom-0 mt-4">
        <Button onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))} disabled={currentPage === 1}>
          Previous
        </Button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <Button
          onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

