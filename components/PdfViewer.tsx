// "use client"

// import { useState, useEffect } from "react"
// import { Document, Page, pdfjs } from "react-pdf"
// import { Button } from "@/components/ui/button"
// import { createClient } from "@/lib/supabase"

// // Set the worker source
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

// interface PdfViewerProps {
//   pdfPath: string
// }

// export default function PdfViewer({ pdfPath }: PdfViewerProps) {
//   const [numPages, setNumPages] = useState<number | null>(null)
//   const [pageNumber, setPageNumber] = useState(1)
//   const [pdfUrl, setPdfUrl] = useState<string | null>(null)
//   const supabase = createClient()

//   useEffect(() => {
//     async function fetchPdfUrl() {
//       try {
//         const { data, error } = await supabase.storage.from("pdfs").createSignedUrl(pdfPath, 3600) // URL valid for 1 hour

//         if (error) throw error
//         setPdfUrl(data.signedUrl)
//       } catch (error) {
//         console.error("Error fetching PDF URL:", error)
//       }
//     }

//     fetchPdfUrl()
//   }, [pdfPath, supabase])

//   function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
//     setNumPages(numPages)
//   }

//   if (!pdfUrl) return <div>Loading PDF...</div>

//   return (
//     <div className="flex flex-col items-center max-w-full p-4">
//       <div className="w-full max-w-3xl">
//         <Document
//           file={pdfUrl}
//           onLoadSuccess={onDocumentLoadSuccess}
//           loading={<div>Loading document...</div>}
//           error={<div>Error loading document. Please try again later.</div>}
//         >
//           <Page
//             pageNumber={pageNumber}
//             width={Math.min(window.innerWidth - 32, 1000)}
//             renderTextLayer={false}
//             renderAnnotationLayer={false}
//           />
//         </Document>

//         {numPages && (
//           <div className="mt-4 flex items-center justify-center gap-4 absolute bottom-0 text-sm">
//             <Button onClick={() => setPageNumber((page) => Math.max(page - 1, 1))} disabled={pageNumber <= 1}>
//               Previous
//             </Button>
//             <span>
//               Page {pageNumber} of {numPages}
//             </span>
//             <Button
//               onClick={() => setPageNumber((page) => Math.min(page + 1, numPages))}
//               disabled={pageNumber >= numPages}
//             >
//               Next
//             </Button>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

