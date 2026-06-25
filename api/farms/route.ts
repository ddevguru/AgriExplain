export const dynamic = "force-static"

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const farms = await sql("SELECT id, name, crop FROM farms LIMIT 20")

    // Add mock status for demo
    const farmsWithStatus = farms.map((farm: any) => ({
      ...farm,
      status: Math.random() > 0.2 ? "online" : "offline",
    }))

    return Response.json(farmsWithStatus)
  } catch (error) {
    console.error("Error:", error)
    return Response.json({ error: "Failed to fetch farms" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, crop, farmer, location } = await request.json()

    const result = await sql(
      "INSERT INTO farms (name, crop, location_lat, location_lng) VALUES ($1, $2, 0, 0) RETURNING id",
      [name, crop],
    )

    return Response.json({ id: result[0].id, name, crop })
  } catch (error) {
    console.error("Error:", error)
    return Response.json({ error: "Failed to create farm" }, { status: 500 })
  }
}
