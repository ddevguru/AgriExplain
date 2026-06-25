"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Leaf, AlertCircle } from "lucide-react"
import { authAPI } from "@/lib/api"

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "farmer",
    phone: ""
  })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      const location = await getCurrentLocation()

      // Signup via FastAPI backend
      await authAPI.signup(
        formData.email,
        formData.password,
        formData.name,
        formData.role,
        formData.phone,
        location
      )
      
      // Auto login after signup
      const loginData = await authAPI.login(formData.email, formData.password)
      
      // Get user info from backend
      const userInfo = await authAPI.getCurrentUser(loginData.access_token)
      if (location) {
        await authAPI.updateLocation(location.lat, location.lng, location.accuracy, "signup", loginData.access_token)
      }
      
      // Store user data
      if (typeof window !== 'undefined') {
        const userData = {
          email: userInfo.email,
          name: userInfo.name,
          role: userInfo.role,
          token: loginData.access_token,
          location_lat: location?.lat,
          location_lng: location?.lng
        }
        sessionStorage.setItem('user', JSON.stringify(userData))
      }

      // Redirect based on role
      if (userInfo.role === "admin") {
        router.push("/admin-dashboard")
      } else {
        router.push("/user-dashboard")
      }
    } catch (err: any) {
      console.error("Signup error:", err)
      if (err.message?.includes("Connection refused") || err.message?.includes("Failed to fetch")) {
        setError("Cannot connect to server. Please make sure the backend is running on http://localhost:8000")
      } else if (err.message?.includes("already registered") || err.message?.includes("already exists")) {
        setError("Email already registered. Please use a different email or login instead.")
      } else {
        setError(err instanceof Error ? err.message : "Signup failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
              <Leaf className="w-14 h-14 text-primary relative" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">AgriXplain</h1>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <Card className="p-8 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Email</label>
              <Input
                type="email"
                placeholder="farmer@agrixplain.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Phone (Optional)</label>
              <Input
                type="tel"
                placeholder="+919876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Confirm Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => router.push("/login")}
              className="text-sm"
            >
              Already have an account? Sign in
            </Button>
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
      </div>
    </main>
  )
}

