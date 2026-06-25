export const dynamic = "force-static"

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Get latest sensor reading (mock data for demo)
    const mockData = {
      temperature: 28.5,
      humidity: 75,
      soil_moisture: 65,
      ph_level: 6.8,
      light_intensity: 850,
      rainfall: 2.3,
    }

    return Response.json(mockData)
  } catch (error) {
    console.error("Error:", error)
    return Response.json({ error: "Failed to fetch sensors" }, { status: 500 })
  }
}
