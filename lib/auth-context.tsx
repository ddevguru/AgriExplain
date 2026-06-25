"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { isFirebaseConfigValid, auth } from "./firebase"

interface UserWithRole {
  uid: string
  email: string | null
  role?: "farmer" | "admin"
}

interface AuthContextType {
  user: UserWithRole | null
  loading: boolean
  error: string | null
  isDemo: boolean
  demoLogin: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemo] = useState(!isFirebaseConfigValid())

  useEffect(() => {
    if (!isFirebaseConfigValid()) {
      // In demo mode, check sessionStorage for user data
      if (typeof window !== "undefined") {
        const userString = sessionStorage.getItem("user")
        if (userString) {
          try {
            const userData = JSON.parse(userString)
            setUser({
              uid: "demo-" + userData.email,
              email: userData.email,
              role: userData.role,
            })
          } catch (error) {
            console.error("Error parsing demo user data:", error)
          }
        }
      }
      setLoading(false)
      return
    }

    try {
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        try {
          if (firebaseUser) {
            const response = await fetch("/api/users/role", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: firebaseUser.email }),
            })
            const data = await response.json()
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: data.role,
            })
          } else {
            setUser(null)
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Auth error")
        } finally {
          setLoading(false)
        }
      })

      return unsubscribe
    } catch (err) {
      setError(err instanceof Error ? err.message : "Firebase initialization error")
      setLoading(false)
    }
  }, [])

  const demoLogin = async (email: string, password: string) => {
    setLoading(true)
    try {
      if (isDemo) {
        // In demo mode, simulate login by setting sessionStorage
        const demoAccounts = [
          { email: "farmer@agrixplain.com", password: "demo123456", role: "farmer", name: "Raj Kumar" },
          { email: "admin@agrixplain.com", password: "demo123456", role: "admin", name: "Admin User" },
        ]
        const account = demoAccounts.find((acc) => acc.email === email && acc.password === password)
        if (!account) {
          throw new Error("Invalid demo credentials")
        }
        const userData = { email: account.email, role: account.role, name: account.name }
        sessionStorage.setItem("user", JSON.stringify(userData))
        setUser({
          uid: "demo-" + account.email,
          email: account.email,
          role: account.role,
        })
      } else {
        const response = await fetch("/api/auth/demo-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })

        if (!response.ok) {
          throw new Error("Demo login failed")
        }

        const data = await response.json()
        setUser(data.user)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login error")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (isFirebaseConfigValid()) {
        await auth.signOut()
      }
      setUser(null)
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("user")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout error")
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, isDemo, demoLogin, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

export type { UserWithRole }
