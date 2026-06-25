export const dynamic = "force-static"

import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const result = await sql("SELECT role FROM users WHERE email = $1", [email])

    if (result.length === 0) {
      return NextResponse.json({ role: "farmer" }, { status: 200 })
    }

    return NextResponse.json({
      role: result[0].role,
    })
  } catch (error) {
    console.error("[v0] Error fetching user role:", error)
    return NextResponse.json({ error: "Failed to fetch user role" }, { status: 500 })
  }
}
