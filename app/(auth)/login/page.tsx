"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"



export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
  
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };
  

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
    <div className="flex flex-col lg:flex-row bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl w-full">
      
      {/* Image Section (Visible on all screens) */}
      <div className="w-full lg:w-1/2">
        <Image
          src="/loginn.jpg"
          alt="Study materials"
          className="w-full h-60 lg:h-full object-cover"
          height={740}
          width={740}
        />
      </div>
  
      {/* Login Form Section */}
      <div className="w-full lg:w-1/2 p-8">
        <p className="text-center text-gray-600 mb-6">Log in to access your study materials</p>
  
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
  
        {/* Signup Link */}
        <div className="pt-4 flex flex-row gap-2 justify-between text-sm">
          <p className="text-gray-600 pt-3">Don&apos;t have an account?</p>
          <Button variant="outline" onClick={() => router.push("/signup")}>Create One</Button>
        </div>
      </div>
    </div>
  </div>
  
  )
}

