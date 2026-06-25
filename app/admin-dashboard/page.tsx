"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Leaf,
  LogOut,
  TrendingUp,
  Activity,
  Users,
  BarChart3,
  Download,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle,
  Building2,
  Database,
  FileText,
  Upload,
  Search,
  Filter,
} from "lucide-react"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import ThermalCamera from "@/components/thermal-camera"
import { modelAPI } from "@/lib/api"
import type { ModelComparison } from "@/lib/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SystemOverview {
  total_farms: number
  active_sensors: string
  active_sensors_percentage: number
  avg_yield_prediction: string
  prediction_accuracy: string
  system_uptime: string
  data_freshness: string
  sensor_coverage: string
}

interface Farm {
  farm_id: string
  farmer: string
  crop: string
  location: string
  last_update: string
  status: string
  yield_pred: string
  confidence: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [overview, setOverview] = useState<SystemOverview | null>(null)
  const [farms, setFarms] = useState<Farm[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [modelComparison, setModelComparison] = useState<ModelComparison[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [showAddFarmModal, setShowAddFarmModal] = useState(false)
  const [newFarm, setNewFarm] = useState({ farm_id: "", name: "", location: "", farmer_phone: "", user_id: "" })
  const [farmers, setFarmers] = useState<any[]>([])

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null
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

  useEffect(() => {
    const checkAuth = () => {
      const userData = sessionStorage.getItem("user")
      console.log("Admin dashboard - checking auth, userData:", userData)
      
      if (!userData) {
        console.log("No user data found, redirecting to login")
        router.push("/login")
        return
      }
      
      try {
        const parsedUser = JSON.parse(userData)
        console.log("Parsed user:", parsedUser)
        console.log("User role:", parsedUser.role)
        
        if (!parsedUser.role || parsedUser.role !== "admin") {
          console.log("User role is not admin, redirecting to user dashboard")
          router.push("/user-dashboard")
          return
        }
        
        console.log("Admin user authenticated, loading dashboard")
        setUser(parsedUser)
        loadDashboard()
      } catch (error) {
        console.error("Error parsing user data:", error)
        router.push("/login")
      }
    }
    checkAuth()
  }, [router])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()
      
      // Load overview
      try {
        const overviewRes = await fetch(`${API_BASE_URL}/api/admin/overview`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (overviewRes.ok) {
          const overviewData = await overviewRes.json()
          setOverview(overviewData)
        } else {
          console.error('Failed to load overview:', overviewRes.status)
          // Set default overview if API fails
          setOverview({
            total_farms: 0,
            active_sensors: "0/0",
            active_sensors_percentage: 0,
            avg_yield_prediction: "0% High",
            prediction_accuracy: "0%",
            system_uptime: "0%",
            data_freshness: "0%",
            sensor_coverage: "0%"
          })
        }
      } catch (e) {
        console.error('Error loading overview:', e)
        // Set default overview on error
        setOverview({
          total_farms: 0,
          active_sensors: "0/0",
          active_sensors_percentage: 0,
          avg_yield_prediction: "0% High",
          prediction_accuracy: "0%",
          system_uptime: "0%",
          data_freshness: "0%",
          sensor_coverage: "0%"
        })
      }
      
      // Load farms
      try {
        const farmsRes = await fetch(`${API_BASE_URL}/api/admin/farms`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (farmsRes.ok) {
          const farmsData = await farmsRes.json()
          setFarms(farmsData.farms || [])
        } else {
          console.error('Failed to load farms:', farmsRes.status)
          setFarms([])
        }
      } catch (e) {
        console.error('Error loading farms:', e)
        setFarms([])
      }

      // Load model comparison (public endpoint)
      try {
        const cmp = await modelAPI.getComparison()
        setModelComparison(cmp.models || [])
      } catch (e) {
        console.error('Error loading model comparison:', e)
        setModelComparison([])
      }
      
      // Load users
      try {
        const usersRes = await fetch(`${API_BASE_URL}/api/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(usersData.users || [])
          // Filter farmers (non-admin users) for dropdown
          const farmerUsers = (usersData.users || []).filter((u: any) => u.role !== 'admin')
          setFarmers(farmerUsers)
        }
      } catch (e) {
        console.error('Error loading users:', e)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleAddFarm = async () => {
    if (!newFarm.farm_id || !newFarm.name || !newFarm.location) {
      alert('Please fill all required fields (Farm ID, Name, Location)')
      return
    }
    
    // If editing existing farm, user_id is optional
    if (!newFarm.user_id && !farms.find(f => f.farm_id === newFarm.farm_id)) {
      alert('Please select a farmer for new farms')
      return
    }
    
    try {
      const token = getAuthToken()
      const selectedFarmer = newFarm.user_id ? farmers.find(f => f.id.toString() === newFarm.user_id) : null
      const response = await fetch(`${API_BASE_URL}/api/admin/farms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          farm_id: newFarm.farm_id,
          name: newFarm.name,
          location: newFarm.location,
          farmer_phone: selectedFarmer?.phone || newFarm.farmer_phone || null,
          user_id: newFarm.user_id ? parseInt(newFarm.user_id) : null
        })
      })
      
      if (response.ok) {
        const isEdit = farms.find(f => f.farm_id === newFarm.farm_id)
        setShowAddFarmModal(false)
        setNewFarm({ farm_id: "", name: "", location: "", farmer_phone: "", user_id: "" })
        loadDashboard()
        alert(isEdit ? 'Farm updated successfully!' : 'Farm added successfully!')
      } else {
        const error = await response.json().catch(() => ({ detail: 'Failed to save farm' }))
        alert(error.detail || 'Failed to save farm')
      }
    } catch (error) {
      console.error('Error saving farm:', error)
      alert('Failed to save farm. Please try again.')
    }
  }


  const handleLogout = () => {
    sessionStorage.removeItem("user")
    router.push("/login")
  }

  const handleExport = async (format: string) => {
    const token = getAuthToken()
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/export/data?format=${format}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (format === 'csv') {
        const blob = new Blob([data.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `agrixplain_export_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const filteredFarms = farms.filter(farm =>
    farm.farm_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farm.farmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farm.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Chart data
  const yieldDistribution = [
    { name: 'High', value: farms.filter(f => f.yield_pred.includes('HIGH')).length, color: '#10b981' },
    { name: 'Medium', value: farms.filter(f => f.yield_pred.includes('Medium')).length, color: '#f59e0b' },
    { name: 'Low', value: farms.filter(f => f.yield_pred.includes('Low')).length, color: '#ef4444' },
  ]

  const statusData = [
    { name: 'Live', value: farms.filter(f => f.status.includes('🟢')).length },
    { name: 'Idle', value: farms.filter(f => f.status.includes('🟡')).length },
    { name: 'Offline', value: farms.filter(f => f.status.includes('🔴')).length },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur" />
              <Leaf className="w-8 h-8 text-primary relative" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AgriXplain Admin</h1>
              <p className="text-xs text-muted-foreground">Researcher & Policy Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={loadDashboard} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="farms">Farms</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="sensors">Sensors</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* 1. SYSTEM OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Farms</p>
                    <p className="text-3xl font-bold mt-2">{overview?.total_farms || 0}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-primary opacity-50" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Sensors</p>
                    <p className="text-3xl font-bold mt-2">{overview?.active_sensors || "0/0"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {overview?.active_sensors_percentage.toFixed(1)}% operational
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-green-600 opacity-50" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Yield Prediction</p>
                    <p className="text-3xl font-bold mt-2">{overview?.avg_yield_prediction || "0%"}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-yellow-600 opacity-50" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Prediction Accuracy</p>
                    <p className="text-3xl font-bold mt-2">{overview?.prediction_accuracy || "0%"}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600 opacity-50" />
                </div>
              </Card>
            </div>

            {/* Thermal Camera (Dual Camera on same page) */}
            <div className="grid lg:grid-cols-2 gap-6">
              <ThermalCamera farmId="farm1" autoRefresh={true} refreshInterval={6000} showLiveStream={false} />
              <ThermalCamera farmId="farm2" autoRefresh={true} refreshInterval={6000} showLiveStream={false} />
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Yield Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={yieldDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {yieldDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Farm Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          {/* 2. ALL FARMS MANAGEMENT */}
          <TabsContent value="farms" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">All Farms Management</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search farms..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Button onClick={() => setShowAddFarmModal(true)}>Add Farm</Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Farm ID</th>
                      <th className="text-left p-3">Farmer</th>
                      <th className="text-left p-3">Crop</th>
                      <th className="text-left p-3">Location</th>
                      <th className="text-left p-3">Last Update</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Yield Pred</th>
                      <th className="text-center p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFarms.map((farm) => (
                      <tr key={farm.farm_id} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{farm.farm_id}</td>
                        <td className="p-3">{farm.farmer}</td>
                        <td className="p-3">{farm.crop}</td>
                        <td className="p-3">{farm.location}</td>
                        <td className="p-3">{farm.last_update}</td>
                        <td className="p-3">{farm.status}</td>
                        <td className="p-3">{farm.yield_pred}</td>
                        <td className="p-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Show farm details in a modal or alert for now
                                alert(`Farm Details:\n\nFarm ID: ${farm.farm_id}\nFarmer: ${farm.farmer}\nCrop: ${farm.crop}\nLocation: ${farm.location}\nLast Update: ${farm.last_update}\nStatus: ${farm.status}\nYield Prediction: ${farm.yield_pred}`)
                              }}
                            >
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setNewFarm({
                                  farm_id: farm.farm_id,
                                  name: farm.farmer,
                                  location: farm.location,
                                  farmer_phone: '',
                                  user_id: ''
                                })
                                setShowAddFarmModal(true)
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete farm ${farm.farm_id}?`)) {
                                  try {
                                    const token = getAuthToken()
                                    const response = await fetch(`${API_BASE_URL}/api/admin/farms/${farm.farm_id}`, {
                                      method: 'DELETE',
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    })
                                    if (response.ok) {
                                      loadDashboard()
                                      alert('Farm deleted successfully!')
                                    } else {
                                      alert('Failed to delete farm')
                                    }
                                  } catch (error) {
                                    console.error('Error deleting farm:', error)
                                    alert('Failed to delete farm')
                                  }
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* 3. MODEL PERFORMANCE MONITORING */}
          <TabsContent value="models" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Model Performance Monitoring</h2>
              <p className="text-sm text-muted-foreground mb-4">
                AgriXplain Fusion is the primary deployed model (weighted RF+XGBoost ensemble). Metrics below come from
                <code className="px-1">/api/models/comparison</code> and update after retraining.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Model</th>
                      <th className="text-right p-3">Accuracy</th>
                      <th className="text-right p-3">F1-Score</th>
                      <th className="text-right p-3">Uncertainty</th>
                      <th className="text-right p-3">Explainability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelComparison.length === 0 ? (
                      <tr className="border-b">
                        <td className="p-3 text-sm text-muted-foreground" colSpan={5}>
                          No model metrics loaded yet.
                        </td>
                      </tr>
                    ) : (
                      modelComparison.map((m, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{m.name}</td>
                          <td className="p-3 text-right">{(m.accuracy * 100).toFixed(1)}%</td>
                          <td className="p-3 text-right">{m.f1_score.toFixed(3)}</td>
                          <td className="p-3 text-right">{m.uncertainty}</td>
                          <td className="p-3 text-right">{m.shap_ready ? "SHAP" : "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex gap-4">
                <Button
                  onClick={async () => {
                    try {
                      const token = getAuthToken()
                      const response = await fetch(`${API_BASE_URL}/api/admin/models/retrain`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ model_type: 'all' })
                      })
                      if (response.ok) {
                        const data = await response.json()
                        alert(`Model retraining started! ${data.message || 'Check logs for progress.'}`)
                      } else {
                        alert('Failed to start model retraining')
                      }
                    } catch (error) {
                      console.error('Error retraining models:', error)
                      alert('Failed to start model retraining')
                    }
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Retrain Models
                </Button>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    try {
                      const token = getAuthToken()
                      const response = await fetch(`${API_BASE_URL}/api/admin/models/versions`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                      })
                      if (response.ok) {
                        const data = await response.json()
                        const versionsText = data.models.map((m: any) => 
                          `${m.name}: v${m.version} (${m.trained_date}) - Accuracy: ${m.accuracy}% - Status: ${m.status}`
                        ).join('\n')
                        alert(`Model Version History:\n\n${versionsText}`)
                      } else {
                        alert('Failed to load version history')
                      }
                    } catch (error) {
                      console.error('Error loading version history:', error)
                      alert('Failed to load version history')
                    }
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Version History
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* 4. SENSOR HEALTH MONITORING */}
          <TabsContent value="sensors" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Sensor Health Monitoring</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Farm</th>
                      <th className="text-left p-3">Sensor</th>
                      <th className="text-left p-3">Last Ping</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Battery</th>
                      <th className="text-left p-3">Error Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farms.map((farm) => (
                      <tr key={farm.farm_id} className="border-b">
                        <td className="p-3">{farm.farm_id}</td>
                        <td className="p-3">All Sensors</td>
                        <td className="p-3">{farm.last_update}</td>
                        <td className="p-3">{farm.status}</td>
                        <td className="p-3">85%</td>
                        <td className="p-3">0%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* 5. USER MANAGEMENT */}
          <TabsContent value="users" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">User Management</h2>
                <Button>Add User</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">User ID</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3">Farm Assigned</th>
                      <th className="text-left p-3">Last Login</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-center p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">1</td>
                      <td className="p-3">admin@agrixplain.com</td>
                      <td className="p-3">Admin User</td>
                      <td className="p-3">Admin</td>
                      <td className="p-3">All</td>
                      <td className="p-3">Today</td>
                      <td className="p-3">Active</td>
                      <td className="p-3 text-center">
                        <Button variant="outline" size="sm">Edit</Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* 6. REPORTS & EXPORT */}
          <TabsContent value="reports" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Data Export & Reports</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-bold mb-2">Export Options</h3>
                  <div className="space-y-2">
                    <Button className="w-full" onClick={() => handleExport('csv')}>
                      <Download className="w-4 h-4 mr-2" />
                      Export All Data (CSV)
                    </Button>
                    <Button variant="outline" className="w-full">
                      <FileText className="w-4 h-4 mr-2" />
                      Model Performance Report (PDF)
                    </Button>
                    <Button variant="outline" className="w-full">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Regional Yield Summary
                    </Button>
                  </div>
                </Card>
                <Card className="p-4">
                  <h3 className="font-bold mb-2">Custom Export</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Date Range</label>
                      <div className="flex gap-2 mt-1">
                        <Input type="date" />
                        <Input type="date" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Farm</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select farm" />
                        </SelectTrigger>
                        <SelectContent>
                          {farms.map(farm => (
                            <SelectItem key={farm.farm_id} value={farm.farm_id}>
                              {farm.farm_id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">Generate Report</Button>
                  </div>
                </Card>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Farm Modal */}
      {showAddFarmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add New Farm</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Farm ID *</label>
                <Input
                  value={newFarm.farm_id}
                  onChange={(e) => setNewFarm({...newFarm, farm_id: e.target.value})}
                  placeholder="farm1"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Farm Name *</label>
                <Input
                  value={newFarm.name}
                  onChange={(e) => setNewFarm({...newFarm, name: e.target.value})}
                  placeholder="Sharma Rice Farm"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Location *</label>
                <Input
                  value={newFarm.location}
                  onChange={(e) => setNewFarm({...newFarm, location: e.target.value})}
                  placeholder="Delhi, India"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Select Farmer *</label>
                <Select
                  value={newFarm.user_id}
                  onValueChange={(value) => {
                    const selectedFarmer = farmers.find(f => f.id.toString() === value)
                    setNewFarm({
                      ...newFarm,
                      user_id: value,
                      farmer_phone: selectedFarmer?.phone || ""
                    })
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a farmer" />
                  </SelectTrigger>
                  <SelectContent>
                    {farmers.length === 0 ? (
                      <SelectItem value="none" disabled>No farmers available. Create a farmer user first.</SelectItem>
                    ) : (
                      farmers.map((farmer) => (
                        <SelectItem key={farmer.id} value={farmer.id.toString()}>
                          {farmer.name || farmer.email} ({farmer.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Farmer Phone</label>
                <Input
                  value={newFarm.farmer_phone}
                  onChange={(e) => setNewFarm({...newFarm, farmer_phone: e.target.value})}
                  placeholder="+919876543210"
                  className="mt-1"
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">Auto-filled from selected farmer</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddFarm} className="flex-1">Add Farm</Button>
                <Button variant="outline" onClick={() => setShowAddFarmModal(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </main>
  )
}
