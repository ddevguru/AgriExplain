"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { TrendingUp, RefreshCw, Download } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function PredictionsPage() {
  const router = useRouter()
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFarm, setSelectedFarm] = useState<string>("all")

  useEffect(() => {
    const userData = sessionStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    loadPredictions()
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

  const loadPredictions = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      if (!token) {
        console.error('No auth token found')
        return
      }
      
      const url = selectedFarm === "all" 
        ? `${API_BASE_URL}/api/admin/predictions`
        : `${API_BASE_URL}/api/admin/predictions?farm_id=${selectedFarm}`
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setPredictions(data.predictions || [])
      } else {
        console.error('Failed to load predictions:', res.status, await res.text())
        // Set empty array if error
        setPredictions([])
      }
    } catch (error) {
      console.error('Error loading predictions:', error)
      setPredictions([])
    } finally {
      setLoading(false)
    }
  }

  const chartData = predictions.length > 0 ? predictions.map(p => ({
    date: p.timestamp ? new Date(p.timestamp).toLocaleDateString() : 'N/A',
    confidence: (p.confidence || 0) * 100,
    yield: p.yield_prediction === 'High' ? 3 : p.yield_prediction === 'Medium' ? 2 : 1
  })) : []

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Predictions Analysis</h1>
          <div className="flex gap-2">
            <Select value={selectedFarm} onValueChange={setSelectedFarm}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Farm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Farms</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadPredictions}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Total Predictions</p>
            <p className="text-3xl font-bold mt-2">{predictions.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Avg Confidence</p>
            <p className="text-3xl font-bold mt-2">
              {predictions.length > 0 
                ? (predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length * 100).toFixed(1)
                : 0}%
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">High Yield</p>
            <p className="text-3xl font-bold mt-2">
              {predictions.filter(p => p.yield_prediction === 'High').length}
            </p>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Prediction Trends</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="confidence" stroke="#8884d8" name="Confidence %" />
                <Line type="monotone" dataKey="yield" stroke="#82ca9d" name="Yield Level" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No prediction data available for chart visualization.</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Recent Predictions</h2>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading predictions...</p>
            </div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No predictions found. Predictions will appear here once sensor data is processed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Farm ID</th>
                    <th className="text-left p-3">Crop</th>
                    <th className="text-left p-3">Yield Prediction</th>
                    <th className="text-left p-3">Confidence</th>
                    <th className="text-left p-3">Uncertainty</th>
                    <th className="text-left p-3">Model</th>
                    <th className="text-left p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.slice(0, 50).map((p, idx) => (
                    <tr key={p.id || idx} className="border-b hover:bg-muted/50">
                      <td className="p-3">{p.farm_id || 'N/A'}</td>
                      <td className="p-3">{p.crop || 'Not Set'}</td>
                      <td className="p-3">
                        <span className={`font-semibold ${
                          p.yield_prediction === 'High' ? 'text-green-600' :
                          p.yield_prediction === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {p.yield_prediction || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3">{(p.confidence ? (p.confidence * 100).toFixed(1) : 0)}%</td>
                      <td className="p-3">{p.uncertainty ? `${p.uncertainty.toFixed(1)}%` : 'N/A'}</td>
                      <td className="p-3 text-sm text-muted-foreground">{p.model_used || 'ensemble'}</td>
                      <td className="p-3">{p.timestamp ? new Date(p.timestamp).toLocaleString() : 'N/A'}</td>
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

