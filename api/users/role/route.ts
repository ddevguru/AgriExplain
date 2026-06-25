export const dynamic = "force-static"

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    const result = await sql("SELECT role FROM users WHERE email = $1", [email])

    if (result.length > 0) {
      return Response.json({ role: result[0].role })
    }

    // Default new users to farmer role
    await sql("INSERT INTO users (email, role, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [
      email,
      "farmer",
      email.split("@")[0],
    ])

    return Response.json({ role: "farmer" })
  } catch (error) {
    console.error("Error:", error)
    return Response.json({ error: "Failed to fetch role" }, { status: 500 })
  }
}
