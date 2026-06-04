"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import {
    Folder,
    ChevronRight,
    Home,
    ArrowLeft,
    Loader2,
    Download,
    BookOpen,
    Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"
import { AuthModal } from "./AuthModal"
import FavoriteButton from "./FavoriteButton"
import Image from "next/image"

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
    icon: any
    color?: string
}

interface FolderItemProps {
    name: string
    icon: any
    onClick: () => void
    color?: string
    variant?: "default" | "back"
}

const FOLDER_ICONS = {
    level: "https://cdn-icons-png.flaticon.com/128/2097/2097068.png",
    course: "https://cdn-icons-png.flaticon.com/128/18991/18991804.png",
    type: "https://cdn-icons-png.flaticon.com/128/2232/2232688.png",
    year: "https://cdn-icons-png.flaticon.com/128/3038/3038168.png",
    pdf: "https://cdn-icons-png.flaticon.com/128/337/337946.png",
    back: "https://cdn-icons-png.flaticon.com/128/271/271220.png"
}

export default function FolderExplorer() {
    const [pdfs, setPdfs] = useState<PdfFile[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPath, setCurrentPath] = useState<string[]>([])
    // const [searchTerm, setSearchTerm] = useState("")
    const [user, setUser] = useState<User | null>(null)
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

    const supabase = useMemo(() => createClient(), [])

    const getCurrentUser = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
    }, [supabase])

    const fetchPdfs = useCallback(async () => {
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
    }, [supabase])

    useEffect(() => {
        fetchPdfs()
        getCurrentUser()
    }, [fetchPdfs, getCurrentUser])

    const rootFolders = [
        { id: "level", name: "By Level", icon: FOLDER_ICONS.level, color: "text-blue-500" },
        { id: "course", name: "By Course", icon: FOLDER_ICONS.course, color: "text-green-500" },
        { id: "type", name: "By Type", icon: FOLDER_ICONS.type, color: "text-purple-500" },
        { id: "year", name: "By Year", icon: FOLDER_ICONS.year, color: "text-orange-500" },
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
                    items: levels.map(l => ({ id: l, name: `Level ${l}`, icon: FOLDER_ICONS.level }))
                }
            }
            if (grouping === "course") {
                const courses = Array.from(new Set(pdfs.map(p => p.course || "Unknown"))).sort()
                return {
                    type: "folders",
                    items: courses.map(c => ({ id: c, name: c, icon: FOLDER_ICONS.course }))
                }
            }
            if (grouping === "type") {
                const types = Array.from(new Set(pdfs.map(p => p.type || "Other"))).sort()
                return {
                    type: "folders",
                    items: types.map(t => ({ id: t, name: t, icon: FOLDER_ICONS.type }))
                }
            }
            if (grouping === "year") {
                const years = Array.from(new Set(pdfs.map(p => new Date(p.created_at).getFullYear().toString()))).sort((a, b) => b.localeCompare(a))
                return {
                    type: "folders",
                    items: years.map(y => ({ id: y, name: y, icon: FOLDER_ICONS.year }))
                }
            }
        }

        // Level 2: Sub-groups or Files
        if (currentPath.length === 2) {
            if (grouping === "level") {
                const coursesInLevel = Array.from(new Set(
                    pdfs.filter(p => p.level === level1Value).map(p => p.course)
                )).sort()

                return {
                    type: "folders",
                    items: coursesInLevel.map(c => ({ id: c, name: c, icon: FOLDER_ICONS.course }))
                }
            }
            // ... rest handled by switch or if-else

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
            <div className="flex items-center gap-2  p-3 mt-8 rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
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
                                name="Back"
                                icon={FOLDER_ICONS.back}
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

function FolderItem({ name, icon, onClick, color, variant = "default" }: FolderItemProps) {
    const isUrl = typeof icon === 'string';
    return (
        <div
            onClick={onClick}
            className={`
                group cursor-pointer flex flex-col items-center justify-center p-6 
                rounded-2xl border transition-all duration-300
                ${variant === "back"
                    ? "bg-gray-50 border-transparent hover:bg-gray-100 text-gray-400"
                    : "bg-white border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-200"
                }
            `}
        >
            <div className={`
                h-16 w-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300
                ${variant === "back" ? "bg-gray-200/50" : "group-hover:bg-blue-100"}
            `}>
                {isUrl ? (
                    <Image src={icon} alt={name} width={50} height={50} className="rounded-lg object-contain transition-transform group-hover:scale-110" />
                ) : (
                    <div className={`h-8 w-8 ${variant === "back" ? "text-gray-400" : (color || "text-blue-600")}`} />
                )}
            </div>
            <span className="text-sm font-semibold text-gray-800 text-center line-clamp-2 leading-tight px-1">
                {name}
            </span>
        </div>
    )
}

function FileCard({ pdf, onView, onDownload, userId }: { pdf: PdfFile, onView: () => void, onDownload: () => void, userId?: string }) {
    return (
        <Card className="group relative overflow-hidden border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white rounded-2xl">
            <CardContent className="p-5 flex flex-col h-full gap-4">
                <div className="flex items-start justify-between gap-3">
                    <div className=" rounded-xl group-hover:bg-red-100 transition-colors duration-300">
                        <Image src={FOLDER_ICONS.pdf} alt={pdf.name} width={50} height={50} className="rounded-lg transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    {userId && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <FavoriteButton pdfId={pdf.id} userId={userId} />
                        </div>
                    )}
                </div>

                <div className="space-y-2 flex-1">
                    <h3 className="font-bold text-base text-gray-900 leading-tight line-clamp-2 min-h-[2.5rem]" title={pdf.name}>
                        {pdf.name}
                    </h3>

                    <div className="flex flex-wrap gap-2 pt-1">
                        <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                            {pdf.course}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-wider">
                            Level {pdf.level}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                            {pdf.type}
                        </span>
                    </div>

                    <div className="flex items-center text-[11px] text-gray-400 mt-2">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Added {new Date(pdf.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onDownload}
                        className="h-10 text-xs font-bold rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border-none transition-all"
                    >
                        <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                    <Button
                        size="sm"
                        onClick={onView}
                        className="h-10 text-xs font-bold rounded-xl bg-green-600 hover:bg-green-600 text-white shadow-md hover:shadow-green-200 transition-all border-none"
                    >
                        <BookOpen className="h-4 w-4 mr-2" /> Preview
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
