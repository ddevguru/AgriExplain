"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import {
  Leaf,
  LogOut,
  Cloud,
  Droplets,
  Zap,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  Wind,
} from "lucide-react"
import ThermalCamera from "@/components/thermal-camera"

const DEMO_SENSOR_DATA = {
  temperature: 28.5,
  humidity: 72,
  soil_moisture: 65,
  ph_level: 6.8,
  light_intensity: 45000,
  rainfall: 12.5,
  nitrogen: 145,
  potassium: 280,
}

const DEMO_PREDICTION = {
  yield_prediction: 8200,
  confidence_score: 0.87,
  crop: "Rice",
  stage: "Heading stage",
  recommendation: "Maintain current irrigation schedule. Light NPK fertilizer application recommended in 3 days.",
}

const DEMO_ALERTS = [
  {
    id: 1,
    type: "warning",
    title: "Temperature Rising",
    message: "Field temperature approaching critical threshold",
    icon: "🌡️",
    action: "Increase irrigation",
  },
  {
    id: 2,
    type: "success",
    title: "Soil Health Optimal",
    message: "Moisture and nutrient levels are excellent",
    icon: "💚",
    action: "Continue monitoring",
  },
  {
    id: 3,
    type: "info",
    title: "Fertilizer Timing",
    message: "Nitrogen levels suggest light NPK needed",
    icon: "🌾",
    action: "Schedule application",
  },
]

const DEMO_CHART_DATA = [
  { time: "00:00", temperature: 22, humidity: 65, moisture: 55 },
  { time: "04:00", temperature: 20, humidity: 72, moisture: 58 },
  { time: "08:00", temperature: 24, humidity: 68, moisture: 62 },
  { time: "12:00", temperature: 28, humidity: 55, moisture: 70 },
  { time: "16:00", temperature: 29, humidity: 50, moisture: 68 },
  { time: "20:00", temperature: 26, humidity: 62, moisture: 65 },
  { time: "24:00", temperature: 23, humidity: 70, moisture: 63 },
]

const FEATURE_IMPORTANCE = [
  { feature: "Temperature", importance: 0.35, value: "28.5°C", icon: "🌡️" },
  { feature: "Humidity", importance: 0.25, value: "72%", icon: "💨" },
  { feature: "Rainfall", importance: 0.2, value: "12.5mm", icon: "🌧️" },
  { feature: "pH Level", importance: 0.15, value: "6.8", icon: "⚗️" },
  { feature: "Light", importance: 0.05, value: "45klux", icon: "☀️" },
]

const RECOMMENDATIONS = [
  {
    icon: "💧",
    title: "Irrigation Management",
    description: "Reduce watering frequency slightly due to recent 12.5mm rainfall",
    priority: "high",
    action: "Adjust schedule",
    time: "Within 24 hours",
  },
  {
    icon: "🌾",
    title: "Fertilizer Application",
    description: "Apply NPK (20:20:20) in next 3 days for optimal growth stage",
    priority: "high",
    action: "Schedule now",
    time: "Within 72 hours",
  },
  {
    icon: "🐛",
    title: "Pest Monitoring",
    description: "Monitor for stem borers - humidity favors pest development",
    priority: "medium",
    action: "Check fields",
    time: "Weekly",
  },
  {
    icon: "🌱",
    title: "Nutrient Status",
    description: "Nitrogen levels at 145 ppm - apply nitrogen-based fertilizer",
    priority: "medium",
    action: "Review soil",
    time: "Next week",
  },
]

export default function FarmerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [sensors] = useState(DEMO_SENSOR_DATA)

  useEffect(() => {
    const userData = sessionStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "farmer") {
      router.push("/admin-dashboard")
      return
    }
    setUser(parsedUser)
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem("user")
    router.push("/login")
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading your farm dashboard...</p>
        </div>
      </div>
    )
  }

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
              <h1 className="text-2xl font-bold">AgriXplain Farm</h1>
              <p className="text-xs text-muted-foreground">Welcome, {user.name}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 bg-transparent">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
        {/* Farm Status Card */}
        <Card className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border-primary/20 p-8 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary uppercase tracking-wide">Current Crop Status</p>
              <h2 className="text-3xl font-bold">{DEMO_PREDICTION.crop}</h2>
              <p className="text-muted-foreground">{DEMO_PREDICTION.stage}</p>
            </div>
            <div className="text-right space-y-2 bg-white/50 backdrop-blur p-4 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Expected Yield</p>
              <p className="text-3xl font-bold text-primary">{DEMO_PREDICTION.yield_prediction} kg/ha</p>
              <p className="text-sm font-semibold text-secondary">
                {Math.round(DEMO_PREDICTION.confidence_score * 100)}% Confidence
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-primary/20">
            <p className="text-sm leading-relaxed">
              <Lightbulb className="w-4 h-4 inline mr-2 text-accent" />
              <span className="font-medium">{DEMO_PREDICTION.recommendation}</span>
            </p>
          </div>
        </Card>

        {/* Real-time Sensor Metrics */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            Real-Time Field Sensors
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<Cloud className="w-6 h-6" />}
              label="Temperature"
              value={`${sensors.temperature}°C`}
              status="optimal"
              detail="Ideal range"
            />
            <MetricCard
              icon={<Droplets className="w-6 h-6" />}
              label="Humidity"
              value={`${sensors.humidity}%`}
              status="good"
              detail="Adequate moisture"
            />
            <MetricCard
              icon={<Zap className="w-6 h-6" />}
              label="Soil Moisture"
              value={`${sensors.soil_moisture}%`}
              status="optimal"
              detail="Well-balanced"
            />
            <MetricCard
              icon={<Wind className="w-6 h-6" />}
              label="pH Level"
              value={sensors.ph_level.toString()}
              status="optimal"
              detail="Optimal range"
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 24-Hour Trends */}
          <Card className="p-6 space-y-4 border-border/50">
            <h3 className="text-lg font-bold">24-Hour Sensor Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={DEMO_CHART_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="time" stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="var(--color-chart-1)"
                  fillOpacity={1}
                  fill="url(#colorTemp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Key Factors (SHAP) */}
          <Card className="p-6 space-y-4 border-border/50">
            <h3 className="text-lg font-bold">AI Yield Factors (SHAP)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={FEATURE_IMPORTANCE}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                <YAxis
                  dataKey="feature"
                  type="category"
                  width={80}
                  tick={{ fontSize: 12 }}
                  stroke="var(--color-muted-foreground)"
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                />
                <Bar dataKey="importance" fill="var(--color-primary)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Smart Recommendations */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent" />
            Smart Recommendations
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {RECOMMENDATIONS.map((rec, idx) => (
              <Card
                key={idx}
                className={`p-5 border-l-4 transition-all hover:shadow-lg ${
                  rec.priority === "high" ? "border-l-accent bg-accent/5" : "border-l-secondary bg-secondary/5"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-2xl mb-2">{rec.icon}</p>
                      <h4 className="font-bold text-sm">{rec.title}</h4>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        rec.priority === "high" ? "bg-accent/20 text-accent" : "bg-secondary/20 text-secondary"
                      }`}
                    >
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{rec.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">{rec.time}</span>
                    <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent">
                      {rec.action}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Thermal Camera with Disease Detection (Dual Camera) */}
        <div className="grid lg:grid-cols-2 gap-6">
          <ThermalCamera farmId="farm1" autoRefresh={true} refreshInterval={6000} showLiveStream={false} />
          <ThermalCamera farmId="farm2" autoRefresh={true} refreshInterval={6000} showLiveStream={false} />
        </div>

        {/* Active Alerts */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Active Alerts & Status
          </h3>
          <div className="space-y-3">
            {DEMO_ALERTS.map((alert) => (
              <Alert
                key={alert.id}
                className={`border-l-4 transition-all ${
                  alert.type === "warning"
                    ? "border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-100"
                    : alert.type === "success"
                      ? "border-green-500 bg-green-50 text-green-900 dark:bg-green-950/30 dark:text-green-100"
                      : "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{alert.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{alert.title}</p>
                    <AlertDescription className="text-sm mt-1">{alert.message}</AlertDescription>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs flex-shrink-0 bg-transparent">
                    {alert.action}
                  </Button>
                </div>
              </Alert>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button className="flex-1 bg-primary hover:bg-primary/90 gap-2 h-11">
            <TrendingUp className="w-4 h-4" />
            Export Detailed Report
          </Button>
          <Button variant="outline" className="flex-1 gap-2 h-11 bg-transparent">
            <CheckCircle className="w-4 h-4" />
            Historical Analysis
          </Button>
          <Button variant="outline" className="flex-1 gap-2 h-11 bg-transparent">
            <Leaf className="w-4 h-4" />
            Farm Settings
          </Button>
        </div>
      </div>
    </main>
  )
}

function MetricCard({
  icon,
  label,
  value,
  status,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  status: "optimal" | "good" | "warning"
  detail: string
}) {
  const statusColors = {
    optimal: "bg-primary/10 border-primary/30 text-primary",
    good: "bg-secondary/10 border-secondary/30 text-secondary",
    warning: "bg-yellow-100/50 border-yellow-300/50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300",
  }

  return (
    <Card className={`p-4 border transition-all hover:shadow-lg ${statusColors[status]}`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xl opacity-80">{icon}</div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <p className="text-xs opacity-60 mt-2">{detail}</p>
      </div>
    </Card>
  )
}
