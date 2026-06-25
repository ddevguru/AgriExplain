"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Leaf, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const getCurrentLocation = (): Promise<{ lat: number; lng: number; accuracy?: number } | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      )
    })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Login via FastAPI backend
      const loginData = await authAPI.login(email, password)
      
      // Get user info from backend
      const userInfo = await authAPI.getCurrentUser(loginData.access_token)
      const location = await getCurrentLocation()
      if (location) {
        await authAPI.updateLocation(location.lat, location.lng, location.accuracy, "login", loginData.access_token)
      }
      
      console.log("Login successful, user info:", userInfo)
      console.log("User role:", userInfo.role)
      
      // Store user data
      const userData = {
        email: userInfo.email,
        name: userInfo.name,
        role: userInfo.role,
        token: loginData.access_token,
        location_lat: location?.lat,
        location_lng: location?.lng
      }
      sessionStorage.setItem('user', JSON.stringify(userData))
      
      // Verify storage
      const stored = sessionStorage.getItem('user')
      console.log("Stored user data:", stored)
      
      // Redirect based on role
      if (userInfo.role === "admin") {
        console.log("Redirecting to admin dashboard")
        window.location.href = "/admin-dashboard"
      } else {
        console.log("Redirecting to user dashboard")
        window.location.href = "/user-dashboard"
      }
    } catch (err: any) {
      console.error("Login error:", err)
      if (err.message?.includes("Connection refused") || err.message?.includes("Failed to fetch")) {
        setError("Cannot connect to server. Please make sure the backend is running on http://localhost:8000")
      } else {
        setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-12 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo Section */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
              <Leaf className="w-14 h-14 text-primary relative" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">AgriXplain</h1>
          <p className="text-muted-foreground text-base">Smart Farming Platform</p>
        </div>

        {/* Login Card */}
        <Card className="p-8 space-y-6 border-border/50 shadow-xl">
          {error && (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <Input
                type="email"
                placeholder="farmer@agrixplain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="bg-muted/50 border-border/50 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="bg-muted/50 border-border/50 focus:border-primary"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-10" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Signup Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button
                variant="link"
                onClick={() => router.push("/signup")}
                className="p-0 h-auto text-primary font-semibold"
              >
                Sign up here
              </Button>
            </p>
          </div>
          
          {/* Backend Connection Info */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Backend Required</p>
                <p>Make sure FastAPI backend is running on http://localhost:8000</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          ✓ Create account to get started • Backend authentication required
        </p>
      </div>
    </main>
  )
}
