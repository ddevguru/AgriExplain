export const dynamic = "force-static"

import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    // For demo mode, validate against hardcoded credentials
    const validDemoAccounts = [
      { email: "farmer@agrixplain.com", password: "demo123456", role: "farmer" },
      { email: "admin@agrixplain.com", password: "demo123456", role: "admin" },
    ]

    const account = validDemoAccounts.find((acc) => acc.email === email && acc.password === password)

    if (!account) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create or get user from PostgreSQL
    const result = await sql(
      "INSERT INTO users (email, role) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET role = $2 RETURNING id, email, role",
      [email, account.role],
    )

    const user = result[0]

    return NextResponse.json({
      success: true,
      user: {
        uid: user.id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("[v0] Demo login error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
