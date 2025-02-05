"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CloudUploadIcon } from "lucide-react";
import { User } from "@supabase/supabase-js";

export default function PdfUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [course, setCourse] = useState("");
  const [level, setLevel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase.auth]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to upload files");
      return;
    }
    if (!file || !course || !level) {
      setError("Please fill in all fields");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from("pdfs").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("pdf_files").insert({
        name: file.name,
        path: filePath,
        course: course,
        level: level,
        status: "pending",
        user_id: user.id,
      });
      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 5000);
      
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
   
      <div className="flex justify-end mb-4">
        <Dialog>
          <DialogTrigger className="bg-primary p-3 text-white rounded-md">
          Upload a New PDF <CloudUploadIcon className="h-4 w-4 ml-2 inline" />
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload a PDF</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label htmlFor="pdf-upload">Select PDF</Label>
                <Input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileChange} disabled={uploading} />
              </div>
              <div>
                <Label htmlFor="course">Course</Label>
                <Input id="course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Enter course name" disabled={uploading} />
              </div>
              <div>
                <Label htmlFor="level">Level</Label>
                <Select onValueChange={setLevel} disabled={uploading}>
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
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert>
                  <AlertDescription>File uploaded successfully! Waiting for approval from admin</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={!file || uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
   
  );
}
