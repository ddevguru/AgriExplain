export const dynamic = "force-static"

import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const farms = await sql(`
      SELECT 
        id,
        name,
        crop,
        CASE 
          WHEN (SELECT COUNT(*) FROM sensors WHERE farm_id = farms.id) > 0 THEN 'online'
          ELSE 'offline'
        END as status
      FROM farms
      ORDER BY created_at DESC
    `)

    return NextResponse.json(farms)
  } catch (error) {
    console.error("[v0] Error fetching farms:", error)
    return NextResponse.json({ error: "Failed to fetch farms" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, crop, location_lat, location_lng, farmer_id } = await request.json()

    const result = await sql(
      `INSERT INTO farms (name, crop, location_lat, location_lng, farmer_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, crop`,
      [name, crop, location_lat, location_lng, farmer_id],
    )

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating farm:", error)
    return NextResponse.json({ error: "Failed to create farm" }, { status: 500 })
  }
}
