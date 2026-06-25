export const dynamic = "force-static"

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Mock predictions data for demo
    const predictions = [
      { farm: "Sharma Farm", crop: "Rice", yield: 87, confidence: 87 },
      { farm: "Gupta Farm", crop: "Wheat", yield: 82, confidence: 82 },
      { farm: "Patel Farm", crop: "Rice", yield: 91, confidence: 91 },
    ]

    return Response.json(predictions)
  } catch (error) {
    console.error("Error:", error)
    return Response.json({ error: "Failed to fetch predictions" }, { status: 500 })
  }
}
