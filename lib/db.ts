import { neon } from "@neondatabase/serverless"

// Create reusable SQL client
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

export default sql
