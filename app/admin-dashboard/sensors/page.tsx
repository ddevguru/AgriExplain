"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, AlertTriangle, CheckCircle } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function SensorsPage() {
  const router = useRouter()
  const [sensors, setSensors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFarm, setSelectedFarm] = useState<string>("all")

  useEffect(() => {
    const userData = sessionStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    loadSensors()
  }, [selectedFarm])

  const getAuthToken = () => {
    const user = sessionStorage.getItem('user')
    if (user) {
      try {
        return JSON.parse(user).token || null
      } catch {
        return null
      }
    }
    return null
  }

  const loadSensors = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const url = selectedFarm === "all"
        ? `${API_BASE_URL}/api/admin/sensors/health`
        : `${API_BASE_URL}/api/admin/sensors/health?farm_id=${selectedFarm}`
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setSensors(data.sensors || [])
      }
    } catch (error) {
      console.error('Error loading sensors:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    if (status.includes("OK") || status.includes("Live")) {
      return <CheckCircle className="w-5 h-5 text-green-600" />
    } else if (status.includes("WARNING") || status.includes("Idle")) {
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />
    } else {
      return <AlertTriangle className="w-5 h-5 text-red-600" />
    }
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sensor Health Monitoring</h1>
          <div className="flex gap-2">
            <Select value={selectedFarm} onValueChange={setSelectedFarm}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Farm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Farms</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadSensors}>
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Total Sensors</p>
            <p className="text-3xl font-bold mt-2">
              {loading ? '...' : sensors.filter(s => !s.sensor_type.includes("Aggregate")).length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Healthy</p>
            <p className="text-3xl font-bold mt-2 text-green-600">
              {loading ? '...' : sensors.filter(s => s.status.includes("🟢") || s.status.includes("OK") || s.status.includes("Live")).length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Warning</p>
            <p className="text-3xl font-bold mt-2 text-yellow-600">
              {loading ? '...' : sensors.filter(s => s.status.includes("🟡") || s.status.includes("WARNING") || s.status.includes("Idle")).length}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Offline/No Data</p>
            <p className="text-3xl font-bold mt-2 text-red-600">
              {loading ? '...' : sensors.filter(s => s.status.includes("🔴") || s.status.includes("OFF") || s.status.includes("Offline") || s.status.includes("No Data")).length}
            </p>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Sensor Status</h2>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading sensor data...</p>
            </div>
          ) : sensors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sensor data found. Sensors will appear here once data is received.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Farm</th>
                    <th className="text-left p-3">Sensor Type</th>
                    <th className="text-left p-3">Last Ping</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Battery</th>
                    <th className="text-left p-3">Error Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {sensors.filter(s => !s.sensor_type.includes("Aggregate")).map((sensor, idx) => (
                    <tr key={`${sensor.farm_id}-${sensor.sensor_type}-${idx}`} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{sensor.farm_id || 'N/A'}</td>
                      <td className="p-3">{sensor.sensor_type || 'Unknown'}</td>
                      <td className="p-3">{sensor.last_ping || 'Never'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(sensor.status)}
                          <span>{sensor.status || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="p-3">{sensor.battery || '-'}</td>
                      <td className="p-3">{sensor.error_rate || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}

