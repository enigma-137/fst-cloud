"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignIn, setIsSignIn] = useState(true)
  const router = useRouter()

  const handleAuth = (type: "login" | "signup") => {
    router.push(`/${type}`)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isSignIn ? "Sign in required" : "Create an account"}</DialogTitle>
          <DialogDescription>
            {isSignIn
              ? "You need to be signed in to download PDFs."
              : "Create an account to download PDFs and access all features."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button onClick={() => handleAuth(isSignIn ? "login" : "signup")}>{isSignIn ? "Log in" : "Sign up"}</Button>
          <div className="text-center">
            <span className="text-sm text-gray-500">
              {isSignIn ? "Don't have an account? " : "Already have an account? "}
            </span>
            <Button variant="link" className="p-0" onClick={() => setIsSignIn(!isSignIn)}>
              {isSignIn ? "Sign up" : "Sign in"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

