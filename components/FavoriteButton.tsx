"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { toast } from "sonner"

interface FavoriteButtonProps {
  pdfId: string
  userId: string
}

export default function FavoriteButton({ pdfId, userId }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkFavoriteStatus()
  }, [pdfId, userId])

  const checkFavoriteStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("favorite_pdfs")
        .select("*")
        .eq("pdf_id", pdfId)
        .eq("user_id", userId)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error checking favorite status:", error)
      }

      setIsFavorited(!!data)
    } catch (error) {
      console.error("Error checking favorite status:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async () => {
    try {
      if (isFavorited) {
        const { error } = await supabase
          .from("favorite_pdfs")
          .delete()
          .eq("pdf_id", pdfId)
          .eq("user_id", userId)

        if (error) throw error
        toast.success("Removed from favorites")
      } else {
        const { error } = await supabase
          .from("favorite_pdfs")
          .insert([{ pdf_id: pdfId, user_id: userId }])

        if (error) throw error
        toast.success("Added to favorites")
      }

      setIsFavorited(!isFavorited)
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast.error("Failed to update favorite status")
    }
  }

  if (loading) {
    return <Button variant="ghost" size="icon" disabled><Star className="h-4 w-4" /></Button>
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFavorite}
      className={isFavorited ? "text-yellow-500" : "text-gray-400"}
    >
      <Star className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
    </Button>
  )
} 