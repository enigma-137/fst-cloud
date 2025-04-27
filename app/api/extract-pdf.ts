import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import pdfParse from "pdf-parse"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: Request) {
  try {
    const { pdfId, pdfPath } = await request.json()

    if (!pdfPath) {
      return NextResponse.json({ error: "PDF path is required" }, { status: 400 })
    }

    // Get the PDF file from Supabase storage
    const { data: pdfData, error: pdfError } = await supabase.storage.from("pdfs").download(pdfPath)

    if (pdfError) {
      console.error("Error downloading PDF:", pdfError)
      return NextResponse.json({ error: "Failed to download PDF" }, { status: 500 })
    }

    // Parse the PDF content
    const buffer = Buffer.from(await pdfData.arrayBuffer())
    const pdfContent = await pdfParse(buffer)

    // Return the extracted text
    return NextResponse.json({
      text: pdfContent.text,
      info: {
        pageCount: pdfContent.numpages,
        pdfId,
      },
    })
  } catch (error) {
    console.error("Error extracting PDF content:", error)
    return NextResponse.json({ error: "Failed to extract PDF content" }, { status: 500 })
  }
}
