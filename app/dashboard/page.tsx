"use client"

import PdfUpload from "@/components/PdfUpload"
import PdfList from "@/components/PdfList"
import { BookOpenTextIcon } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="container mx-auto px-1  py-8 max-w-7xl">
      <div className="space-y-8">
        <div>
          <PdfUpload />
        </div>

        <div className="bg-white rounded-lg p-1">
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            Available Documents <BookOpenTextIcon className="ml-2 h-5 w-5 inline"/>
          </h2>
          <PdfList />
        </div>
      </div>
    </div>
  )
}
