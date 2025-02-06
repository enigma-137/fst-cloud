"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CloudUploadIcon, CheckCircle } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

export default function PdfUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [course, setCourse] = useState("")
  const [level, setLevel] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const resetForm = () => {
    setFile(null)
    setCourse("")
    setLevel("")
    setDescription("")
    setTags("")
    setError(null)
    const fileInput = document.getElementById("pdf-upload") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) {
      setError("You must be logged in to upload files")
      return
    }
    if (!file || !course || !level) {
      setError("Please fill in all required fields")
      return
    }

    setUploading(true)
    setError(null)

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage.from("pdfs").upload(filePath, file)
      if (uploadError) throw uploadError

      // Convert tags string to array and remove empty strings
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const { error: insertError } = await supabase.from("pdf_files").insert({
        name: file.name,
        path: filePath,
        course: course,
        level: level,
        status: "pending",
        user_id: user.id,
        description: description || null, // Use null if description is empty
        tags: tagsArray.length > 0 ? tagsArray : null, // Use null if no tags
      })
      if (insertError) throw insertError

      // Close the modal
      setIsOpen(false)

      // Show success toast
      toast.success("PDF Uploaded Successfully", {
        description: (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Upload Complete!</span>
            </div>
            <p className="text-gray-600">
              Your PDF is now under review. Once approved, it will appear on the dashboard.
            </p>
          </div>
        ),
        duration: 5000,
      })

      // Reset the form
      resetForm()
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("An unexpected error occurred")
      }
      console.error("Upload error:", error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex justify-end mb-4">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="bg-primary hover:bg-primary/90">
            Add a New PDF <CloudUploadIcon className="h-4 w-4 ml-2" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload a PDF</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="pdf-upload">Select PDF</Label>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="cursor-pointer"
              />
            </div>
            <div>
              <Label htmlFor="course">Course</Label>
              <Input
                id="course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="Enter course name"
                disabled={uploading}
              />
            </div>
            <div>
              <Label htmlFor="level">Level</Label>
              <Select onValueChange={setLevel} disabled={uploading} value={level}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 Level</SelectItem>
                  <SelectItem value="200">200 Level</SelectItem>
                  <SelectItem value="300">300 Level</SelectItem>
                  <SelectItem value="400">400 Level</SelectItem>
                  <SelectItem value="500">500 Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a brief description of the PDF"
                disabled={uploading}
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (Optional, comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., lecture, notes, assignment"
                disabled={uploading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={!file || uploading}>
                {uploading ? "Uploading..." : "Upload PDF"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

