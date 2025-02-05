'use client'

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { ArrowLeftCircleIcon } from "lucide-react";

interface PdfFile {
  id: string;
  name: string;
  created_at: string;
  course: string;
  level: string;
  status: "pending" | "approved" | "rejected";
  description: string;
  tags: string[];
}

export default function AdminApprove() {
  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();


  const fetchPendingPdfs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pdf_files")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      setError("Error fetching PDFs");
      console.error("Error fetching PDFs:", error);
    } else {
      setPdfs(data as PdfFile[]);
    }
    setLoading(false);
  }, [supabase]);

 
  useEffect(() => {
    fetchPendingPdfs();

    const subscription = supabase
      .channel("pdf_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pdf_files" },
        () => {
          fetchPendingPdfs(); // Refetch data when a PDF is updated
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription); // Cleanup on unmount
    };
  }, [fetchPendingPdfs, supabase]);

  async function handleApproval(id: string, approved: boolean) {
    try {
      console.log(`Updating PDF ${id} status to ${approved ? "approved" : "rejected"}...`);

      const { data, error } = await supabase
        .from("pdf_files")
        .update({ status: approved ? "approved" : "rejected" })
        .eq("id", id)
        .select(); // Ensures we see the updated row

      if (error) {
        console.error("Supabase update error:", error);
        throw new Error(error.message);
      }

      console.log("Supabase update result:", data);

   
      await fetchPendingPdfs();
    } catch (error) {
      if (error instanceof Error) {
        setError(`Error updating PDF status: ${error.message}`);
      } else {
        setError("An unknown error occurred");
      }
      console.error("Error updating PDF status:", error);
    }
  }

  if (loading) return <div className="min-h-screen flex justify-center items-center">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <Button onClick={() => router.push("/dashboard")}>
        <ArrowLeftCircleIcon className="ml-2 h-3 w-3 inline" />
        Back
      </Button>
      <h1 className="text-2xl font-bold mb-4 text-center">Admin Page</h1>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pdfs.map((pdf) => (
          <Card key={pdf.id}>
            <CardHeader>
              <CardTitle>{pdf.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Course: {pdf.course}</p>
              <p>Level: {pdf.level}</p>
              <p>Description: {pdf.description}</p>
              <p>Tags: {pdf.tags?.join(", ")}</p>
              <p>Status: {pdf.status}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => handleApproval(pdf.id, true)} className="bg-green-500 hover:bg-green-700">
                Approve
              </Button>
              <Button onClick={() => handleApproval(pdf.id, false)} variant="destructive">
                Reject
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {pdfs.length === 0 && <p className="text-center mt-4">No pending PDFs to approve.</p>}
    </div>
  );
}
