export const dynamic = "force-static"

import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get latest sensor reading for demo purposes
    const reading = await sql(`
      SELECT 
        temperature,
        humidity,
        soil_moisture,
        ph_level,
        light_intensity,
        rainfall
      FROM sensor_readings
      ORDER BY timestamp DESC
      LIMIT 1
    `)

    if (reading.length === 0) {
      // Return mock data if no readings exist
      return NextResponse.json({
        temperature: 28.5,
        humidity: 65,
        soil_moisture: 55,
        ph_level: 6.8,
        light_intensity: 1200,
        rainfall: 0.5,
      })
    }

    return NextResponse.json(reading[0])
  } catch (error) {
    console.error("[v0] Error fetching latest sensor data:", error)
    // Return mock data as fallback
    return NextResponse.json({
      temperature: 28.5,
      humidity: 65,
      soil_moisture: 55,
      ph_level: 6.8,
      light_intensity: 1200,
      rainfall: 0.5,
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sensor_id, farm_id, temperature, humidity, soil_moisture, ph_level, light_intensity, rainfall } =
      await request.json()

    const result = await sql(
      `INSERT INTO sensor_readings (sensor_id, farm_id, temperature, humidity, soil_moisture, ph_level, light_intensity, rainfall) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [sensor_id, farm_id, temperature, humidity, soil_moisture, ph_level, light_intensity, rainfall],
    )

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating sensor reading:", error)
    return NextResponse.json({ error: "Failed to create sensor reading" }, { status: 500 })
  }
}
