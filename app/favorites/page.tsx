"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Loader2Icon, FolderOpen } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import FavoriteButton from "@/components/FavoriteButton"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

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

export default function FavoritesPage() {
  const [favoritePdfs, setFavoritePdfs] = useState<PdfFile[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUserAndFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        try {
          const { data, error } = await supabase
            .from("favorite_pdfs")
            .select(`
              pdf_id,
              pdf_files (
                id,
                name,
                created_at,
                course,
                level,
                status,
                path,
                description,
                tags
              )
            `)
            .eq("user_id", user.id)

          if (error) throw error

          const pdfs = data
            .flatMap((item: { pdf_files?: PdfFile[] }) => item.pdf_files ?? [])
            .filter((pdf: PdfFile) => pdf && pdf.status === "approved")

          setFavoritePdfs(pdfs)
        } catch (error) {
          console.error("Error fetching favorite PDFs:", error)
          toast.error("Failed to load favorite PDFs")
        } finally {
          setLoading(false)
        }
      }
    }
    getUserAndFavorites()
  }, [supabase])

  const handleDownload = async (pdf: PdfFile) => {
    try {
      const { data, error } = await supabase.storage.from("pdfs").download(pdf.path)

      if (error) throw error

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

  if (loading) {
    return (
      <div className="min-h-[400px] flex justify-center items-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2Icon className="h-5 w-5 animate-spin" />
          <span>Loading favorites...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[400px] flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Please log in to view your favorites</h2>
          <Button onClick={() => window.location.href = "/login"}>Go to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* <div className="flex justify-between items-center mb-6">
     
        <Button onClick={() => router.back()} className="bg-green-600 hover:bg-green-700 text-white">
          Back
        </Button>
        </div> */}
      <h1 className="text-2xl font-bold mb-6">My Favorite PDFs</h1>
      
      {favoritePdfs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Image
            src="/empty.jpg"
            alt="No favorites"
            height={300}
            width={300}
            className="mb-6 opacity-75"
          />
          <p className="text-gray-500">You haven&apos;t favorited any PDFs yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoritePdfs.map((pdf) => (
            <Card key={pdf.id} className="flex flex-col hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold line-clamp-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen fill="green" fillOpacity="0.8" className="h-12 w-12 text-green-700 flex-shrink-0" />
                    <span>{pdf.name}</span>
                  </div>
                  <FavoriteButton pdfId={pdf.id} userId={user.id} />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Course: {pdf.course}</span>
                    <span>•</span>
                    <span>Level: {pdf.level}</span>
                  </div>
                  {pdf.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{pdf.description}</p>
                  )}
                  {pdf.tags && pdf.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {pdf.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardContent className="pt-0">
                <Button
                  onClick={() => handleDownload(pdf)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 