"use client"

import FolderExplorer from "@/components/FolderExplorer"



export default function FoldersPage() {
    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="flex-1 p-4 md:p-6 overflow-hidden">
                <FolderExplorer />
            </div>
        </div>
    )
}
