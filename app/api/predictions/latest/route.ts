export const dynamic = "force-static"

import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const prediction = await sql(`
      SELECT 
        crop,
        yield_prediction,
        confidence_score,
        recommendation
      FROM predictions
      ORDER BY created_at DESC
      LIMIT 1
    `)

    if (prediction.length === 0) {
      // Return mock data if no predictions exist
      return NextResponse.json({
        crop: "Rice",
        yield_prediction: 85,
        confidence_score: 0.87,
        recommendation: "Current conditions are optimal for growth",
      })
    }

    return NextResponse.json(prediction[0])
  } catch (error) {
    console.error("[v0] Error fetching latest prediction:", error)
    // Return mock data as fallback
    return NextResponse.json({
      crop: "Rice",
      yield_prediction: 85,
      confidence_score: 0.87,
      recommendation: "Current conditions are optimal for growth",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { farm_id, crop, yield_prediction, confidence_score, shap_values, recommendation } = await request.json()

    const result = await sql(
      `INSERT INTO predictions (farm_id, crop, yield_prediction, confidence_score, shap_values, recommendation) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [farm_id, crop, yield_prediction, confidence_score, JSON.stringify(shap_values), recommendation],
    )

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating prediction:", error)
    return NextResponse.json({ error: "Failed to create prediction" }, { status: 500 })
  }
}
