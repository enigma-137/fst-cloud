"use client"

import PdfUpload from "@/components/PdfUpload"
import PdfList from "@/components/PdfList"
import { BookOpenTextIcon } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <PdfUpload />
      </div>
      <div className="flex flex-col flex-1 h-0 bg-white rounded-lg">
        <div className="flex items-center px-4 py-2 border-b">
          <h2 className="text-lg md:text-xl font-semibold">
            Available Documents <BookOpenTextIcon className="ml-2 h-5 w-5 inline"/>
          </h2>
        </div>
        <div className="flex-1 min-h-0">
          <PdfList />
        </div>
      </div>
    </div>
  )
}
