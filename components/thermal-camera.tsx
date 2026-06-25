"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, RefreshCw, Scan, Thermometer, AlertTriangle, CheckCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/contexts/LanguageContext"
import { t } from "@/lib/i18n"

interface ThermalCameraProps {
  farmId: string
  autoRefresh?: boolean
  refreshInterval?: number
  showLiveStream?: boolean
}

interface CameraData {
  id?: number
  farm_id: string
  image_url?: string
  thermal_image_url?: string
  timestamp?: string
  temperature_zones?: {
    min_temp: number
    max_temp: number
    avg_temp: number
    hot_spots: number
  }
  fallback?: boolean
  message?: string
}

interface DiagnosisResult {
  diagnosis: string
  confidence: number
  details: Record<string, any>
  recommendations: string
  thermal_image_url?: string
  diseases?: Array<{
    disease: string
    confidence: number
    severity: string
    symptoms: string
  }>
}

export default function ThermalCamera({ farmId, autoRefresh = true, refreshInterval = 30000, showLiveStream = true }: ThermalCameraProps) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const { language } = useLanguage()
  const [cameraData, setCameraData] = useState<CameraData | null>(null)
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveStreamActive, setLiveStreamActive] = useState(false)
  const [streamDiagnosis, setStreamDiagnosis] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"static" | "live">(showLiveStream ? "live" : "static")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const videoRef = useRef<HTMLImageElement>(null)
  const diagnosisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // If live streaming is disabled for this usage, always fall back to static mode
    if (!showLiveStream && viewMode !== "static") {
      setViewMode("static")
      return
    }

    if (viewMode === "static") {
      loadCameraData()
      
      if (autoRefresh) {
        const interval = setInterval(() => {
          loadCameraData()
        }, refreshInterval)
        return () => clearInterval(interval)
      }
    } else if (viewMode === "live" && showLiveStream) {
      startLiveStream()
      return () => {
        stopLiveStream()
      }
    }
  }, [farmId, autoRefresh, refreshInterval, viewMode, showLiveStream])

  const startLiveStream = () => {
    if (liveStreamActive) return
    
    setLiveStreamActive(true)
    
    // Load live stream
    if (videoRef.current) {
      videoRef.current.src = `${API_BASE_URL}/api/camera/stream?farm_id=${farmId}`
    }
    
    // Update diagnosis periodically
    if (diagnosisIntervalRef.current) {
      clearInterval(diagnosisIntervalRef.current)
    }
    diagnosisIntervalRef.current = setInterval(async () => {
      try {
        const userData = sessionStorage.getItem("user")
        let token = null
        if (userData) {
          try {
            const user = JSON.parse(userData)
            token = user.token || null
          } catch (e) {
            console.error("Error parsing user data:", e)
          }
        }
        
        const headers: HeadersInit = {
          "Content-Type": "application/json"
        }
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }
        
        const response = await fetch(`${API_BASE_URL}/api/camera/stream/diagnosis?farm_id=${farmId}`, {
          headers
        })
        
        if (response.ok) {
          const data = await response.json()
          setStreamDiagnosis(data)
        }
      } catch (err) {
        console.error("Error fetching stream diagnosis:", err)
      }
    }, 2000) // Update every 2 seconds
  }

  const stopLiveStream = () => {
    setLiveStreamActive(false)
    if (diagnosisIntervalRef.current) {
      clearInterval(diagnosisIntervalRef.current)
      diagnosisIntervalRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.src = ""
    }
  }

  const loadCameraData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get token from sessionStorage
      const userData = sessionStorage.getItem("user")
      let token = null
      if (userData) {
        try {
          const user = JSON.parse(userData)
          token = user.token || null
        } catch (e) {
          console.error("Error parsing user data:", e)
        }
      }
      
      const headers: HeadersInit = {
        "Content-Type": "application/json"
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
      
      const response = await fetch(`${API_BASE_URL}/api/camera/latest?farm_id=${farmId}`, {
        headers
      })
      
      if (!response.ok) {
        throw new Error("Failed to load camera data")
      }
      
      const data = await response.json()
      setCameraData(data)
      
      // If we have thermal image, render it
      if (data.thermal_image_url && !data.fallback) {
        renderThermalImage(data.thermal_image_url)
      }
      return data as CameraData
    } catch (err: any) {
      console.error("Error loading camera data:", err)
      setError(err.message || "Failed to load camera data")
      // Set fallback data
      setCameraData({
        farm_id: farmId,
        fallback: true,
        message: "Camera offline or not initialized. Using fallback visualization."
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  const renderThermalImage = (imageUrl: string) => {
    if (!canvasRef.current || !imageRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    const img = imageRef.current
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
    }
    img.src = imageUrl
  }

  const scanPlant = async () => {
    try {
      setScanning(true)
      setError(null)
      
      // Get token from sessionStorage
      const userData = sessionStorage.getItem("user")
      let token = null
      if (userData) {
        try {
          const user = JSON.parse(userData)
          token = user.token || null
        } catch (e) {
          console.error("Error parsing user data:", e)
        }
      }
      
      const headers: HeadersInit = {
        "Content-Type": "application/json"
      }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // In live mode, scan should use live stream diagnosis directly
      if (viewMode === "live") {
        const streamResp = await fetch(`${API_BASE_URL}/api/camera/stream/diagnosis?farm_id=${farmId}`, {
          headers
        })
        if (!streamResp.ok) {
          throw new Error("Failed to fetch live diagnosis")
        }
        const streamData = await streamResp.json()
        setStreamDiagnosis(streamData)
        return
      }
      
      const response = await fetch(`${API_BASE_URL}/api/camera/diagnose`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          farm_id: farmId,
          image_id: cameraData?.id
        })
      })
      
      if (!response.ok) {
        throw new Error("Failed to diagnose plant")
      }
      
      const result = await response.json()
      setDiagnosis(result)
    } catch (err: any) {
      console.error("Error scanning plant:", err)
      setError(err.message || "Failed to scan plant")
    } finally {
      setScanning(false)
    }
  }

  const getDiagnosisColor = (diagnosis: string) => {
    switch (diagnosis.toLowerCase()) {
      case "healthy":
        return "text-green-600"
      case "disease or pest infestation":
        return "text-red-600"
      case "nutrient deficiency":
        return "text-yellow-600"
      case "water stress":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  const getDiagnosisIcon = (diagnosis: string) => {
    switch (diagnosis.toLowerCase()) {
      case "healthy":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-red-600" />
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">{t(language, 'dashboard.thermalCamera')}</h3>
        </div>
        <div className="flex gap-2">
          {showLiveStream && (
            <div className="flex gap-1 border rounded-md">
              <Button
                variant={viewMode === "live" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("live")}
              >
                {t(language, 'thermal.liveView')}
              </Button>
              <Button
                variant={viewMode === "static" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("static")}
              >
                {t(language, 'thermal.staticView')}
              </Button>
            </div>
          )}
          {(viewMode === "static" || viewMode === "live") && (
            <>
              {viewMode === "static" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadCameraData}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  {t(language, 'common.refresh')}
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={scanPlant}
                disabled={scanning}
              >
                <Scan className={`w-4 h-4 mr-2 ${scanning ? "animate-pulse" : ""}`} />
                {scanning ? t(language, 'common.loading') : t(language, 'actions.scanPlant')}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {viewMode === "static" && cameraData?.fallback && (
        <Alert>
          <AlertDescription>
            {cameraData.message || t(language, 'thermal.cameraStream') + ' ' + t(language, 'common.error')}
          </AlertDescription>
        </Alert>
      )}

      <div className="relative">
        {viewMode === "live" && showLiveStream ? (
          <div className="relative">
            <img
              ref={videoRef}
              alt={t(language, 'thermal.cameraStream')}
              onError={() => {
                setError("Live stream unavailable, switched to static view")
                setViewMode("static")
                loadCameraData()
              }}
              className="w-full h-auto rounded-lg border-2 border-primary/20"
              style={{
                filter: "contrast(1.2) saturate(1.3)",
                imageRendering: "auto"
              }}
            />
            {streamDiagnosis && streamDiagnosis.has_issue && (
              <div className="absolute top-4 left-4 bg-red-600/90 text-white p-3 rounded-lg space-y-1 text-sm max-w-xs">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{streamDiagnosis.status}</span>
                </div>
                {streamDiagnosis.issues && streamDiagnosis.issues.length > 0 && (
                  <div className="text-xs space-y-1 mt-2">
                    {streamDiagnosis.issues.map((issue: any, idx: number) => (
                      <div key={idx}>
                        {issue.type}: {(issue.confidence * 100).toFixed(0)}%
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {streamDiagnosis && !streamDiagnosis.has_issue && (
              <div className="absolute top-4 left-4 bg-green-600/90 text-white p-3 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{t(language, 'status.healthy')}</span>
                </div>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : cameraData?.thermal_image_url ? (
          <div className="relative">
            <img
              ref={imageRef}
              src={cameraData.thermal_image_url}
              alt={t(language, 'dashboard.thermalCamera')}
              className="w-full h-auto rounded-lg border-2 border-primary/20"
              style={{
                filter: "contrast(1.2) saturate(1.3)",
                imageRendering: "auto"
              }}
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            {cameraData.temperature_zones && (
              <div className="absolute top-4 right-4 bg-black/70 text-white p-3 rounded-lg space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  <span>{t(language, 'thermal.temperatureZones')}</span>
                </div>
                <div>{t(language, 'thermal.minTemp')}: {cameraData.temperature_zones.min_temp.toFixed(1)}{t(language, 'units.celsius')}</div>
                <div>{t(language, 'thermal.maxTemp')}: {cameraData.temperature_zones.max_temp.toFixed(1)}{t(language, 'units.celsius')}</div>
                <div>{t(language, 'thermal.avgTemp')}: {cameraData.temperature_zones.avg_temp.toFixed(1)}{t(language, 'units.celsius')}</div>
                <div>{t(language, 'thermal.hotSpots')}: {cameraData.temperature_zones.hot_spots}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-red-900 via-yellow-900 to-blue-900 rounded-lg flex items-center justify-center text-white">
            <div className="text-center">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-75">{t(language, 'common.error')}</p>
            </div>
          </div>
        )}
      </div>

      {(diagnosis || (viewMode === "live" && streamDiagnosis)) && (
        <Card className="p-4 bg-muted/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getDiagnosisIcon(viewMode === "live" && streamDiagnosis ? streamDiagnosis.status : diagnosis?.diagnosis || t(language, 'status.healthy'))}
                <h4 className="font-semibold">{t(language, 'dashboard.plantDiagnosis')} {viewMode === "live" ? `(${t(language, 'thermal.liveView')})` : ""}</h4>
              </div>
              <span className={`text-sm font-medium ${getDiagnosisColor(viewMode === "live" && streamDiagnosis ? streamDiagnosis.status : diagnosis?.diagnosis || t(language, 'status.healthy'))}`}>
                {viewMode === "live" && streamDiagnosis ? streamDiagnosis.status : diagnosis?.diagnosis || t(language, 'status.healthy')}
              </span>
            </div>
            
            {viewMode === "live" && streamDiagnosis ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">{t(language, 'thermal.confidence')}</span>
                    <span className="text-sm font-medium">{(streamDiagnosis.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={streamDiagnosis.confidence * 100} className="h-2" />
                </div>
                
                {streamDiagnosis.issues && streamDiagnosis.issues.length > 0 && (
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{t(language, 'thermal.detectedIssues')}:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      {streamDiagnosis.issues.map((issue: any, idx: number) => (
                        <li key={idx}>
                          {issue.type} - {(issue.confidence * 100).toFixed(0)}% {t(language, 'thermal.confidence').toLowerCase()} ({issue.severity})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              diagnosis && (
                <>
                  {/* Leaf Diseases Detected */}
                  {diagnosis.diseases && diagnosis.diseases.length > 0 && (
                    <div className="space-y-2 mb-3">
                      <p className="font-medium text-sm">{t(language, 'thermal.detectedIssues')}:</p>
                      <div className="space-y-2">
                        {diagnosis.diseases.map((disease: any, idx: number) => (
                          <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-red-700 dark:text-red-400">{disease.disease}</span>
                              <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                                {(disease.confidence * 100).toFixed(0)}% confidence
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-1 rounded ${
                                disease.severity === 'high' ? 'bg-red-500 text-white' : 
                                disease.severity === 'moderate' ? 'bg-yellow-500 text-white' : 
                                'bg-blue-500 text-white'
                              }`}>
                                {disease.severity.toUpperCase()}
                              </span>
                              <span className="text-xs text-muted-foreground">Severity</span>
                            </div>
                            {disease.symptoms && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <strong>Symptoms:</strong> {disease.symptoms}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">{t(language, 'thermal.confidence')}</span>
                      <span className="text-sm font-medium">{(diagnosis.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={diagnosis.confidence * 100} className="h-2" />
                  </div>

                  {diagnosis.details && Object.keys(diagnosis.details).length > 0 && (
                    <div className="text-sm space-y-1">
                      <p className="font-medium">{t(language, 'common.view')}:</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        {Object.entries(diagnosis.details).map(([key, value]) => (
                          <li key={key}>
                            <span className="capitalize">{key.replace(/_/g, " ")}</span>: {String(value)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {diagnosis.recommendations && (
                    <div className="text-sm">
                      <p className="font-medium mb-1">{t(language, 'thermal.recommendations')}:</p>
                      <p className="text-muted-foreground">{diagnosis.recommendations}</p>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        </Card>
      )}

      {cameraData?.timestamp && (
        <p className="text-xs text-muted-foreground text-center">
          {t(language, 'common.refresh')}: {new Date(cameraData.timestamp).toLocaleString()}
        </p>
      )}
    </Card>
  )
}

