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
  const [files, setFiles] = useState<File[]>([])
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
      const selectedFiles = Array.from(e.target.files).slice(0, 3)
      setFiles(selectedFiles)
      if (e.target.files.length > 3) {
        setError("You can only upload up to 3 files at a time.")
      } else {
        setError(null)
      }
    }
  }

  const resetForm = () => {
    setFiles([])
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
    if (files.length === 0 || !course || !level) {
      setError("Please fill in all required fields and select at least one file")
      return
    }
    if (files.length > 3) {
      setError("You can only upload up to 3 files at a time.")
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Convert tags string to array and remove empty strings
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      for (const file of files) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage.from("pdfs").upload(filePath, file)
        if (uploadError) throw uploadError

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
      }

      // Close the modal
      setIsOpen(false)

      // Show success toast
      toast.success("PDF(s) Uploaded Successfully", {
        description: (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Upload Complete!</span>
            </div>
            <p className="text-gray-600">
              Your PDF(s) are now under review. Once approved, they will appear on the dashboard.
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
   <div className="fixed bottom-24 md:bottom-36 right-6 z-50">
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogTrigger asChild>
      <Button className="bg-primary hover:bg-primary/90 shadow-lg rounded-full px-5 py-3">
        New PDF <CloudUploadIcon className="h-6 w-6 animate-bounce" />
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Upload a PDF</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleUpload} className="space-y-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 text-xs text-yellow-800 rounded">
          <strong>Note:</strong> All selected files will be uploaded with the same course, level, description, and tags. Please only select files that belong to the same course and level.
        </div>
        <div>
          <Label htmlFor="pdf-upload">Select PDF(s) (max 3)</Label>
          <Input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            multiple
            disabled={uploading}
            className="cursor-pointer"
          />
          {files.length > 0 && (
            <ul className="text-xs mt-1 text-gray-600 list-disc list-inside">
              {files.map((f, i) => (
                <li key={i}>{f.name}</li>
              ))}
            </ul>
          )}
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
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={files.length === 0 || uploading}>
            {uploading ? "Uploading..." : "Upload PDF"}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</div>

  )
}

