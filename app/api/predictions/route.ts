export const dynamic = "force-static"

import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const predictions = await sql(`
      SELECT 
        f.name as farm,
        p.crop,
        CAST(p.yield_prediction as INTEGER) as yield,
        CAST(p.confidence_score * 100 as INTEGER) as confidence
      FROM predictions p
      JOIN farms f ON p.farm_id = f.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `)

    if (predictions.length === 0) {
      // Return mock data if no predictions exist
      return NextResponse.json([
        { farm: "North Field", crop: "Rice", yield: 85, confidence: 87 },
        { farm: "South Field", crop: "Wheat", yield: 78, confidence: 82 },
        { farm: "East Garden", crop: "Maize", yield: 92, confidence: 90 },
      ])
    }

    return NextResponse.json(predictions)
  } catch (error) {
    console.error("[v0] Error fetching predictions:", error)
    // Return mock data as fallback
    return NextResponse.json([
      { farm: "North Field", crop: "Rice", yield: 85, confidence: 87 },
      { farm: "South Field", crop: "Wheat", yield: 78, confidence: 82 },
      { farm: "East Garden", crop: "Maize", yield: 92, confidence: 90 },
    ])
  }
}
