export const dynamic = "force-static"

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Mock prediction data
    const mockData = {
      crop: "Rice",
      yield_prediction: 87,
      confidence_score: 0.87,
      recommendation: "Continue current irrigation schedule. Conditions are optimal.",
    }

    return Response.json(mockData)
  } catch (error) {
    console.error("Error:", error)
    return Response.json({ error: "Failed to fetch prediction" }, { status: 500 })
  }
}
