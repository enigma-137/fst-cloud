import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase credentials:", {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceRoleKey
  });
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Log the request method and URL
    console.log("Received request:", {
      method: request.method,
      url: request.url
    });

    const { pdfId, pdfPath, title } = await request.json();
    console.log("Processing PDF:", { pdfId, pdfPath, title });

    if (!pdfPath) {
      console.error("Missing PDF path in request");
      return NextResponse.json({ error: "PDF path is required" }, { status: 400 });
    }

    // Get the PDF file from Supabase storage
    console.log("Attempting to download PDF from Supabase storage:", pdfPath);
    const { data: pdfData, error: pdfError } = await supabase.storage.from("pdfs").download(pdfPath);

    if (pdfError) {
      console.error("Error downloading PDF:", {
        error: pdfError,
        message: pdfError.message
      });
      return NextResponse.json({ error: `Failed to download PDF: ${pdfError.message}` }, { status: 500 });
    }

    if (!pdfData) {
      console.error("No PDF data received from Supabase storage");
      return NextResponse.json({ error: "No PDF data received" }, { status: 500 });
    }

    try {
      // Convert Blob to Buffer
      console.log("Converting PDF data to buffer");
      const buffer = Buffer.from(await pdfData.arrayBuffer());
      
      // Initialize Tesseract worker
      console.log("Starting Tesseract worker creation");
      let worker;
      let text: string;
      try {
        worker = await createWorker('eng');
        console.log("Tesseract worker created successfully");
        
        // Process the PDF
        console.log("Starting PDF recognition");
        const result = await worker.recognize(buffer);
        text = result.data.text;
        console.log("PDF recognition completed");
      } catch (error: any) {
        console.error("Error initializing Tesseract worker:", {
          error,
          message: error.message,
          stack: error.stack
        });
        return NextResponse.json({ error: `Failed to initialize Tesseract worker: ${error.message}` }, { status: 500 });
      }
      
      console.log("PDF processed successfully, text length:", text.length);

      // Store the extracted text in Supabase
      console.log("Storing extracted text in Supabase");
      const { error: insertError } = await supabase
        .from("documents")
        .insert({
          pdf_id: pdfId,
          title: title,
          text_content: text,
          metadata: {
            processed_at: new Date().toISOString()
          }
        });

      if (insertError) {
        console.error("Error storing document in Supabase:", {
          error: insertError,
          message: insertError.message
        });
        return NextResponse.json({ error: `Failed to store document: ${insertError.message}` }, { status: 500 });
      }

      console.log("Successfully processed PDF and stored text");
      return NextResponse.json({
        success: true,
        text: text,
        info: {
          pdfId,
        },
      });
    } catch (error: any) {
      console.error("Error processing PDF content:", {
        error,
        message: error.message,
        stack: error.stack
      });
      return NextResponse.json({ error: `Failed to process PDF content: ${error.message}` }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in PDF processing endpoint:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: "Failed to process PDF", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}