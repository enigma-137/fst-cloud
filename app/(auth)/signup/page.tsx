"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const supabase = createClient()


  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      setIsSuccess(true)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  }

  if (isSuccess) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Check your email</h2>
            <p className="mt-2 text-sm text-gray-600">
              We&apos;ve sent a verification link to
            </p>
            <p className="mt-1 text-lg font-medium text-blue-600">{email}</p>
            <Image src="/comfirm.jpg" alt="confirm" height={740} width={740} className="h-80 w-80" />
            <div className="mt-8 space-y-4">
              <p className="text-sm text-gray-500">
                Click the link in the email to verify your account. If you don&apos;t see the email, check your spam folder.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = "/login"}
              >
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
    <div className="flex flex-col lg:flex-row bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl w-full">
      
      {/* Image Section (Visible on all screens) */}
      <div className="w-full lg:w-1/2">
        <Image
          src="/sign-up.jpg"
          alt="Welcome to FST Cloud"
          className="w-full h-60 lg:h-full object-cover"
          height={740}
          width={740}
        />
      </div>
  
      {/* Form Section */}
      <div className="w-full lg:w-1/2 p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900">Create your account</h1>
        <p className="mt-2 text-center text-sm text-gray-600">Join us to access all features</p>
  
        <form onSubmit={handleSignup} className="space-y-6 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              placeholder="Create a password"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Sign Up
          </Button>
        </form>
  
        {/* Login Link */}
        <div className="pt-4 flex flex-row gap-2 justify-between text-sm">
          <p className="text-gray-600 pt-3">Already have an account?</p>
          <Button variant="outline" onClick={() => router.push("/login")}>Log In</Button>
        </div>
      </div>
    </div>
  </div>
  
  
  )
}