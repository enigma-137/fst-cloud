"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import {
    Folder,
    FileText,
    ChevronRight,
    Home,
    ArrowLeft,
    Loader2,
    Download,
    BookOpen,
    type LucideIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"
import { AuthModal } from "./AuthModal"
import FavoriteButton from "./FavoriteButton"

// Duplicate interface from PdfList for now (should be shared later)
interface PdfFile {
    id: string
    name: string
    created_at: string
    course: string
    level: string
    status: "pending" | "approved" | "rejected"
    path: string
    type: string
    description: string
    tags: string[]
}

type GroupingType = "level" | "course" | "type" | "year"

interface FolderData {
    id: string
    name: string
    icon: LucideIcon
    color?: string
}

interface FolderItemProps {
    name: string
    icon: LucideIcon
    onClick: () => void
    color?: string
    variant?: "default" | "back"
}

export default function FolderExplorer() {
    const [pdfs, setPdfs] = useState<PdfFile[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPath, setCurrentPath] = useState<string[]>([])
    // const [searchTerm, setSearchTerm] = useState("")
    const [user, setUser] = useState<User | null>(null)
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchPdfs()
        getCurrentUser()
    })

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
    }

    const fetchPdfs = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from("pdf_files")
                .select("*")
                .eq("status", "approved")
                .order("created_at", { ascending: false })

            if (error) throw error
            setPdfs(data as PdfFile[])
        } catch (error) {
            console.error("Error fetching PDFs:", error)
            toast.error("Failed to load documents")
        } finally {
            setLoading(false)
        }
    }

    const rootFolders = [
        { id: "level", name: "By Level", icon: Folder, color: "text-blue-500" },
        { id: "course", name: "By Course", icon: Folder, color: "text-green-500" },
        { id: "type", name: "By Type", icon: Folder, color: "text-purple-500" },
        { id: "year", name: "By Year", icon: Folder, color: "text-orange-500" },
    ]

    // Helper to get content based on current path
    const getContent = () => {
        // Level 0: Root
        if (currentPath.length === 0) {
            return { type: "folders", items: rootFolders }
        }

        const grouping = currentPath[0] as GroupingType
        const level1Value = currentPath[1] // e.g., "100" (Level) or "CHEM101" (Course)
        const level2Value = currentPath[2] // e.g., "CHEM101" (Course inside Level)

        // Level 1: List unique values for the chosen grouping (e.g., all Levels)
        if (currentPath.length === 1) {
            if (grouping === "level") {
                const levels = Array.from(new Set(pdfs.map(p => p.level || "Unknown"))).sort()
                return {
                    type: "folders",
                    items: levels.map(l => ({ id: l, name: `Level ${l}`, icon: Folder }))
                }
            }
            if (grouping === "course") {
                const courses = Array.from(new Set(pdfs.map(p => p.course || "Unknown"))).sort()
                return {
                    type: "folders",
                    items: courses.map(c => ({ id: c, name: c, icon: Folder }))
                }
            }
            if (grouping === "type") {
                const types = Array.from(new Set(pdfs.map(p => p.type || "Other"))).sort()
                return {
                    type: "folders",
                    items: types.map(t => ({ id: t, name: t, icon: Folder }))
                }
            }
            if (grouping === "year") {
                const years = Array.from(new Set(pdfs.map(p => new Date(p.created_at).getFullYear().toString()))).sort((a, b) => b.localeCompare(a))
                return {
                    type: "folders",
                    items: years.map(y => ({ id: y, name: y, icon: Folder }))
                }
            }
        }

        // Level 2: Sub-groups or Files
        if (currentPath.length === 2) {
            // By Level -> "100" -> Show Courses in that level (OR just files?)
            // Let's do Level -> Course -> Files for better organization
            if (grouping === "level") {
                const coursesInLevel = Array.from(new Set(
                    pdfs.filter(p => p.level === level1Value).map(p => p.course)
                )).sort()

                return {
                    type: "folders",
                    items: coursesInLevel.map(c => ({ id: c, name: c, icon: Folder }))
                }
            }

            // By Course -> "CHEM101" -> Show Files
            if (grouping === "course") {
                const files = pdfs.filter(p => p.course === level1Value)
                return { type: "files", items: files }
            }

            // By Type -> "Exam" -> Show Files
            if (grouping === "type") {
                const files = pdfs.filter(p => p.type === level1Value)
                return { type: "files", items: files }
            }

            // By Year -> "2024" -> Show Files
            if (grouping === "year") {
                const files = pdfs.filter(p => new Date(p.created_at).getFullYear().toString() === level1Value)
                return { type: "files", items: files }
            }
        }

        // Level 3: Files (specifically for Level -> Course -> Files)
        if (currentPath.length === 3) {
            if (grouping === "level") {
                // Path: ["level", "100", "CHEM101"]
                const files = pdfs.filter(p => p.level === level1Value && p.course === level2Value)
                return { type: "files", items: files }
            }
        }

        return { type: "empty", items: [] }
    }

    const handleNavigate = (id: string) => {
        setCurrentPath([...currentPath, id])
    }

    const handleBreadcrumbClick = (index: number) => {
        setCurrentPath(currentPath.slice(0, index)) // Slice up to that index (exclusive of the rest)
        // Wait, if index is -1 (Home), slice(0, 0) gives empty array. Correct.
        // If index is 0 (Root Item), slice(0, 1) keeps just that item. Correct.
    }

    // --- File Actions (Duplicate from PdfList) ---
    const handleDownload = async (pdf: PdfFile) => {
        if (!user) { setIsAuthModalOpen(true); return; }
        try {
            const { data, error } = await supabase.storage.from("pdfs").download(pdf.path)
            if (error) throw error
            const url = window.URL.createObjectURL(data)
            const a = document.createElement("a")
            a.href = url
            a.download = pdf.name
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            toast.success("Downloaded successfully")
        } catch (error) {
            console.error(error)
            toast.error("Download failed")
        }
    }

    const handleView = async (pdf: PdfFile) => {
        if (!user) { setIsAuthModalOpen(true); return; }
        try {
            const { data, error } = await supabase.storage.from("pdfs").createSignedUrl(pdf.path, 3600)
            if (error) throw error
            window.open(data.signedUrl, "_blank")
        } catch (err) {
            console.error(err)
            toast.error("Could not open document")
        }
    }

    const { type, items } = getContent()

    // Helper to format breadcrumb names
    const getBreadcrumbName = (segment: string, index: number) => {
        if (index === 0) {
            const folder = rootFolders.find(f => f.id === segment)
            return folder ? folder.name : segment
        }
        if (index === 1 && currentPath[0] === 'level') return `Level ${segment}`
        return segment
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header & Breadcrumbs */}
            <div className="flex items-center gap-2  p-3 rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPath([])}
                    className={currentPath.length === 0 ? "text-primary " : "text-gray-500"}
                >
                    <Home className="h-4 w-4" />
                </Button>

                {currentPath.map((segment, index) => (
                    <div key={`${segment}-${index}`} className="flex items-center gap-1 min-w-0">
                        <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBreadcrumbClick(index + 1)}
                            className={`text-sm px-2 font-medium ${index === currentPath.length - 1 ? "text-gray-900 pointer-events-none" : "text-gray-500 hover:text-primary"}`}
                        >
                            {getBreadcrumbName(segment, index)}
                        </Button>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">

                {/* If viewing folders */}
                {type === "folders" && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {/* Back Button if not at root */}
                        {currentPath.length > 0 && (
                            <FolderItem
                                name=".."
                                icon={ArrowLeft}
                                onClick={() => setCurrentPath(prev => prev.slice(0, -1))}
                                variant="back"
                            />
                        )}

                        {(items as FolderData[]).map((folder) => (
                            <FolderItem
                                key={folder.id}
                                name={folder.name}
                                icon={folder.icon}
                                color={folder.color}
                                onClick={() => handleNavigate(folder.id)}
                            />
                        ))}
                    </div>
                )}

                {/* If viewing files */}
                {type === "files" && (
                    <div className="space-y-4">
                        {currentPath.length > 0 && (
                            <Button
                                variant="ghost"
                                onClick={() => setCurrentPath(prev => prev.slice(0, -1))}
                                className="mb-2 gap-2 text-gray-500"
                            >
                                <ArrowLeft className="h-4 w-4" /> Back to folders
                            </Button>
                        )}

                        {items.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Folder className="h-12 w-12 mx-auto text-gray-200 mb-3" />
                                <p>No documents found in this folder.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {(items as PdfFile[]).map((pdf) => (
                                    <FileCard
                                        key={pdf.id}
                                        pdf={pdf}
                                        onView={() => handleView(pdf)}
                                        onDownload={() => handleDownload(pdf)}
                                        userId={user?.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
    )
}

// --- Sub-components ---

function FolderItem({ name, icon: Icon, onClick, color, variant = "default" }: FolderItemProps) {
    return (
        <div
            onClick={onClick}
            className={`
                group cursor-pointer flex flex-col items-center justify-center p-4 
                rounded-xl border transition-all duration-200
                ${variant === "back"
                    ? "bg-gray-100 border-transparent hover:bg-gray-200 text-gray-500"
                    : "bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200"
                }
            `}
        >
            <div className={`
                h-12 w-12 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110
            `}>
                <Icon className={`h-6 w-6 ${color || "text-blue-500"}`} />
            </div>
            <span className="text-sm font-medium text-gray-700 text-center line-clamp-2">
                {name}
            </span>
        </div>
    )
}

function FileCard({ pdf, onView, onDownload, userId }: { pdf: PdfFile, onView: () => void, onDownload: () => void, userId?: string }) {
    return (
        <Card className="hover:shadow-md transition-shadow group relative">
            <CardContent className="p-4 flex flex-col h-full gap-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="p-2  rounded-lg">
                        <FileText className="h-6 w-6 text-red-500" />
                    </div>
                    {userId && <FavoriteButton pdfId={pdf.id} userId={userId} />}
                </div>

                <div className="space-y-1 flex-1">
                    <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 leading-snug" title={pdf.name}>
                        {pdf.name}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">PDF</span>
                        <span>•</span>
                        <span>{new Date(pdf.created_at).toLocaleDateString()}</span>
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                    <Button variant="outline" size="sm" onClick={onDownload} className="h-8 text-xs w-full">
                        <Download className="h-3 w-3 mr-1.5" /> Save
                    </Button>
                    <Button size="sm" onClick={onView} className="h-8 text-xs w-full bg-green-600 hover:bg-green-700 text-white">
                        <BookOpen className="h-3 w-3 mr-1.5" /> View
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
