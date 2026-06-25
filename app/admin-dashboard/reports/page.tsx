"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, BarChart3 } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [selectedFarm, setSelectedFarm] = useState<string>("all")

  useEffect(() => {
    const userData = sessionStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
  }, [])

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

  const handleExport = async (format: string) => {
    try {
      setLoading(true)
      const token = getAuthToken()
      const params = new URLSearchParams({ format })
      if (selectedFarm !== "all") params.append('farm_id', selectedFarm)
      if (dateRange.start) params.append('start_date', dateRange.start)
      if (dateRange.end) params.append('end_date', dateRange.end)

      const res = await fetch(`${API_BASE_URL}/api/admin/export/data?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        if (format === 'csv') {
          const blob = new Blob([data.data], { type: 'text/csv' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `agrixplain_export_${new Date().toISOString().split('T')[0]}.csv`
          a.click()
        }
        alert('Export successful!')
      } else {
        alert('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Reports & Data Export</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Quick Export</h2>
            <div className="space-y-3">
              <Button className="w-full" onClick={() => handleExport('csv')} disabled={loading}>
                <Download className="w-4 h-4 mr-2" />
                Export All Data (CSV)
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <FileText className="w-4 h-4 mr-2" />
                Model Performance Report (PDF)
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <BarChart3 className="w-4 h-4 mr-2" />
                Regional Yield Summary
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Custom Export</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Date Range</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  />
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Farm</label>
                <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select farm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Farms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => handleExport('csv')} disabled={loading}>
                Generate Report
              </Button>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Report History</h2>
          <div className="text-center py-8 text-muted-foreground">
            No reports generated yet
          </div>
        </Card>
      </div>
    </main>
  )
}

