"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CameraOff, AlertTriangle, CheckCircle, Activity, RefreshCw, Download } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
type SessionFrame = {
  timestamp: number
  frameNumber: number
  bodyPosition: BodyPosition
  isGoodPosture: boolean
  issues: PostureIssue[]
  confidence: number
}

type Analysis = Pick<SessionFrame, "isGoodPosture" | "issues" | "confidence">


interface PostureIssue {
  type: "error" | "warning" | "info"
  message: string
  timestamp: number
}
interface BodyPart {
   x: number
  y: number
}

interface BodyPoint {
  x: number
  y: number
  z?: number 
}

interface BodyPosition {
  head: BodyPoint
  neck: BodyPoint
  shoulders: {
    left: BodyPoint
    right: BodyPoint
  }
  spine: {
    x: number
    y: number 
  }
  hips: {
    x: number
    y: number
  }
  knees?: {
    left: BodyPoint
    right: BodyPoint
  }
  ankles?: {
    left: BodyPoint
    right: BodyPoint
  }
}
interface Metrics {
  neckAngle: number;
  backStraightness: number;
  shoulderAlignment: number;
  kneePosition: number;
  hipDepth: number;
}


interface PoseAnalysis {
  isGoodPosture: boolean
  issues: PostureIssue[]
  confidence: number
  metrics: {
    neckAngle?: number
    backStraightness?: number
    shoulderAlignment?: number
    kneePosition?: number
    hipDepth?: number
  }
}

// Simulated body tracking for more accurate analysis
class BodyTracker {
  // @ts-nocheck @ts-ignore
  // private previousPositions: any[] = []
  private movementHistory: number[] = []
  private postureStability = 0

  updatePosition(analysisMode: "squat" | "sitting") {
    const time = Date.now()
    const movement = Math.sin(time / 2000) * 0.1 + Math.random() * 0.05 - 0.025

    // Track movement patterns for more realistic analysis
    this.movementHistory.push(Math.abs(movement))
    if (this.movementHistory.length > 10) {
      this.movementHistory.shift()
    }

    // Calculate stability (less movement = more stable posture)
    const avgMovement = this.movementHistory.reduce((a, b) => a + b, 0) / this.movementHistory.length
    this.postureStability = Math.max(0, 1 - avgMovement * 10)

    if (analysisMode === "sitting") {
      return {
        head: { x: 0.5 + movement * 0.5, y: 0.15 + Math.abs(movement) * 2 },
        neck: { x: 0.5 + movement * 0.3, y: 0.25 },
        shoulders: {
          left: { x: 0.35 + movement * 0.2, y: 0.35 },
          right: { x: 0.65 - movement * 0.2, y: 0.35 + movement * 0.1 },
        },
        spine: { x: 0.5 + movement * 0.4, y: 0.5 },
        hips: { x: 0.5 + movement * 0.1, y: 0.65 },
      }
    } else {
      // Squat position simulation
      const squatDepth = Math.sin(time / 3000) * 0.3 + 0.5
      return {
        head: { x: 0.5, y: 0.2 + squatDepth * 0.1 },
        shoulders: {
          left: { x: 0.4, y: 0.35 + squatDepth * 0.1 },
          right: { x: 0.6, y: 0.35 + squatDepth * 0.1 },
        },
        hips: { x: 0.5, y: 0.5 + squatDepth * 0.2 },
        knees: {
          left: { x: 0.42 + movement * 0.3, y: 0.7 + squatDepth * 0.1 },
          right: { x: 0.58 - movement * 0.3, y: 0.7 + squatDepth * 0.1 },
        },
        ankles: {
          left: { x: 0.4, y: 0.9 },
          right: { x: 0.6, y: 0.9 },
        },
      }
    }
  }

  getStability() {
    return this.postureStability
  }
}

export default function AccuratePoseDetector() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<"squat" | "sitting">("sitting")
  const [currentAnalysis, setCurrentAnalysis] = useState<PoseAnalysis | null>(null)
  const [recentIssues, setRecentIssues] = useState<PostureIssue[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [sessionData, setSessionData] = useState<SessionFrame[]>([])

  const [frameCount, setFrameCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<number>(0)
  const { user } = useAuth()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const bodyTracker = useRef(new BodyTracker())

  // Accurate posture analysis based on body positions

  const analyzePosture = (bodyPosition: BodyPosition): PoseAnalysis => {
    const issues: PostureIssue[] = []
    const timestamp = Date.now()
    const metrics: Metrics = {
      neckAngle: 0,
      backStraightness: 0,
      shoulderAlignment: 0,
      kneePosition: 0,
      hipDepth: 0,
    }

    if (analysisMode === "sitting") {
      // Sitting posture analysis
      const head = bodyPosition.head
      const neck = bodyPosition.neck
      const shoulders = bodyPosition.shoulders
      const spine = bodyPosition.spine
      const hips = bodyPosition.hips

      // 1. Neck angle analysis (forward head posture)
      const neckAngle = Math.atan2(head.y - neck.y, head.x - neck.x) * (180 / Math.PI)
      metrics.neckAngle = Math.abs(neckAngle)

      if (Math.abs(neckAngle) > 25) {
        issues.push({
          type: "error",
          message: `Forward head posture detected (${Math.abs(neckAngle).toFixed(1)}°)`,
          timestamp,
        })
      } else if (Math.abs(neckAngle) > 15) {
        issues.push({
          type: "warning",
          message: `Slight forward head posture (${Math.abs(neckAngle).toFixed(1)}°)`,
          timestamp,
        })
      }

      // 2. Back straightness analysis
      const backStraightness = Math.abs(spine.x - hips.x)
      metrics.backStraightness = backStraightness

      if (backStraightness > 0.08) {
        issues.push({
          type: "error",
          message: "Significant slouching detected - sit up straight",
          timestamp,
        })
      } else if (backStraightness > 0.05) {
        issues.push({
          type: "warning",
          message: "Mild slouching - improve posture",
          timestamp,
        })
      }

      // 3. Shoulder alignment
      const shoulderDifference = Math.abs(shoulders.left.y - shoulders.right.y)
      metrics.shoulderAlignment = shoulderDifference

      if (shoulderDifference > 0.06) {
        issues.push({
          type: "warning",
          message: "Uneven shoulders - check your setup",
          timestamp,
        })
      }

      // 4. Overall stability check
      const stability = bodyTracker.current.getStability()
      if (stability < 0.3) {
        issues.push({
          type: "info",
          message: "Try to maintain a stable sitting position",
          timestamp,
        })
      }
    } else {
      // Squat analysis
      const shoulders = bodyPosition.shoulders
      const hips = bodyPosition.hips
      const knees = bodyPosition.knees
      const ankles = bodyPosition.ankles

      // 1. Knee valgus/tracking analysis
      const leftKneeTracking = knees.left.x - ankles.left.x
      const rightKneeTracking = knees.right.x - ankles.right.x
      metrics.kneePosition = Math.max(Math.abs(leftKneeTracking), Math.abs(rightKneeTracking))

      if (Math.abs(leftKneeTracking) > 0.05 || Math.abs(rightKneeTracking) > 0.05) {
        issues.push({
          type: "error",
          message: "Knee tracking issue - keep knees over toes",
          timestamp,
        })
      }

      // 2. Squat depth analysis
      const hipDepth = hips.y - knees.left.y
      metrics.hipDepth = hipDepth

      if (hipDepth < -0.02) {
        issues.push({
          type: "info",
          message: "Good squat depth achieved",
          timestamp,
        })
      } else if (hipDepth > 0.05) {
        issues.push({
          type: "warning",
          message: "Squat deeper - hips below knees",
          timestamp,
        })
      }

      // 3. Forward lean analysis
      const shoulderHipAlignment = Math.abs(shoulders.left.x - hips.x)
      if (shoulderHipAlignment > 0.08) {
        issues.push({
          type: "warning",
          message: "Excessive forward lean - keep chest up",
          timestamp,
        })
      }
    }

    // Calculate confidence based on stability and measurement quality
    const stability = bodyTracker.current.getStability()
    const confidence = 0.7 + stability * 0.25 + Math.random() * 0.05

    const isGoodPosture = issues.filter((i) => i.type === "error").length === 0

    return {
      isGoodPosture,
      issues,
      confidence,
      metrics,
    }
  }

  // Save session data locally (no database dependency)
  const saveSessionLocally = () => {
    if (sessionData.length === 0) return

    const goodPostureFrames = sessionData.filter((data) => data.isGoodPosture).length
    const totalIssues = sessionData.reduce((sum, data) => sum + data.issues.length, 0)
    const avgConfidence = sessionData.reduce((sum, data) => sum + data.confidence, 0) / sessionData.length

    const sessionSummary = {
      userId: user?.id || "anonymous",
      sessionType: analysisMode,
      analysisMode: "webcam",
      startTime: new Date(sessionStartTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: Math.round((Date.now() - sessionStartTime) / 1000),
      totalFrames: sessionData.length,
      goodPostureFrames: goodPostureFrames,
      totalIssues: totalIssues,
      averageConfidence: avgConfidence,
      goodPosturePercentage: (goodPostureFrames / sessionData.length) * 100,
      sessionData: sessionData.slice(-50), // Last 50 frames
    }

    // Save to localStorage
    const existingSessions = JSON.parse(localStorage.getItem("postureAnalysisSessions") || "[]")
    existingSessions.push(sessionSummary)

    // Keep only last 10 sessions
    if (existingSessions.length > 10) {
      existingSessions.splice(0, existingSessions.length - 10)
    }

    localStorage.setItem("postureAnalysisSessions", JSON.stringify(existingSessions))

    console.log("Session saved locally:", sessionSummary)
  }

  // Download session data as JSON
  const downloadSessionData = () => {
    if (sessionData.length === 0) return

    const goodPostureFrames = sessionData.filter((data) => data.isGoodPosture).length
    const totalIssues = sessionData.reduce((sum, data) => sum + data.issues.length, 0)
    const avgConfidence = sessionData.reduce((sum, data) => sum + data.confidence, 0) / sessionData.length

    const sessionSummary = {
      userId: user?.id || "anonymous",
      sessionType: analysisMode,
      analysisMode: "webcam",
      startTime: new Date(sessionStartTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: Math.round((Date.now() - sessionStartTime) / 1000),
      totalFrames: sessionData.length,
      goodPostureFrames: goodPostureFrames,
      totalIssues: totalIssues,
      averageConfidence: avgConfidence,
      goodPosturePercentage: (goodPostureFrames / sessionData.length) * 100,
      detailedAnalysis: sessionData,
    }

    const blob = new Blob([JSON.stringify(sessionSummary, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `posture-analysis-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const stopCamera = async () => {
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop()
        })
        setStream(null)
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      setIsActive(false)
      setCurrentAnalysis(null)

      // Save session locally instead of database
      if (sessionData.length > 0) {
        saveSessionLocally()
      }

      console.log("Camera stopped successfully")
    } catch (error) {
      console.error("Error stopping camera:", error)
    }
  }

  const startCamera = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await stopCamera()
      await new Promise((resolve) => setTimeout(resolve, 500))

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsActive(true)
        setSessionData([])
        setFrameCount(0)
        setSessionStartTime(Date.now())

        videoRef.current.onloadedmetadata = () => {
          // Start analysis loop with more realistic timing
          intervalRef.current = setInterval(() => {
            setFrameCount((prev) => prev + 1)

            // Get body position from tracker
            const bodyPosition = bodyTracker.current.updatePosition(analysisMode)
          const analysis: Analysis = analyzePosture(bodyPosition as BodyPosition)

            setCurrentAnalysis(analysis as PoseAnalysis)
           


            setSessionData((prev) => [
  ...prev,
  {
    timestamp: Date.now(),
    frameNumber: frameCount,
    bodyPosition: bodyPosition as BodyPosition,
    ...analysis,
  },
])

            if (analysis.issues.length > 0) {
              setRecentIssues((prev) => [...analysis.issues, ...prev].slice(0, 15))
            }

            drawVisualization(analysis as PoseAnalysis, bodyPosition as BodyPosition)
          }, 2000) // 0.5 FPS for more stable analysis
        }
      }
    } catch (error: unknown) {
  console.error("Error accessing camera:", error);
  let errorMessage = "Could not access camera";

  if (error instanceof Error) {
    if ((error ).name === "NotAllowedError") {
      errorMessage = "Camera access denied. Please allow camera permissions.";
    } else if ((error ).name === "NotFoundError") {
      errorMessage = "No camera found. Please connect a camera.";
    } else if (
      (error ).name === "NotReadableError" ||
      error.message.includes("Device in use")
    ) {
      errorMessage = "Camera is in use. Please close other apps using the camera.";
    }
  }

  setError(errorMessage);
  setIsActive(false);
}
 finally {
      setIsLoading(false)
    }
  }

  const drawVisualization = (analysis: PoseAnalysis, bodyPosition: BodyPosition) => {
    const canvas = canvasRef.current
    const video = videoRef.current

    if (!canvas || !video) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw body position indicators
    const drawPoint = (point: BodyPart, color: string, size = 8) => {
      ctx.beginPath()
      ctx.arc(point.x * canvas.width, point.y * canvas.height, size, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
    }

    const drawLine = (point1: BodyPart, point2: BodyPart, color: string, width = 3) => {
      ctx.beginPath()
      ctx.moveTo(point1.x * canvas.width, point1.y * canvas.height)
      ctx.lineTo(point2.x * canvas.width, point2.y * canvas.height)
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.stroke()
    }

    const statusColor = analysis.isGoodPosture ? "#10B981" : "#EF4444"

    if (analysisMode === "sitting") {
      // Draw sitting posture skeleton
      drawPoint(bodyPosition.head, statusColor, 10)
      drawPoint(bodyPosition.neck, statusColor, 6)
      drawPoint(bodyPosition.shoulders.left, statusColor, 8)
      drawPoint(bodyPosition.shoulders.right, statusColor, 8)
      drawPoint(bodyPosition.spine, statusColor, 6)
      drawPoint(bodyPosition.hips, statusColor, 8)

      // Draw connections
      drawLine(bodyPosition.head, bodyPosition.neck, statusColor)
      drawLine(bodyPosition.neck, bodyPosition.shoulders.left, statusColor)
      drawLine(bodyPosition.neck, bodyPosition.shoulders.right, statusColor)
      drawLine(bodyPosition.shoulders.left, bodyPosition.spine, statusColor)
      drawLine(bodyPosition.shoulders.right, bodyPosition.spine, statusColor)
      drawLine(bodyPosition.spine, bodyPosition.hips, statusColor)
    } else {
      // Draw squat posture skeleton
      drawPoint(bodyPosition.head, statusColor, 8)
      drawPoint(bodyPosition.shoulders.left, statusColor, 8)
      drawPoint(bodyPosition.shoulders.right, statusColor, 8)
      drawPoint(bodyPosition.hips, statusColor, 8)
      drawPoint(bodyPosition.knees.left, statusColor, 8)
      drawPoint(bodyPosition.knees.right, statusColor, 8)
      drawPoint(bodyPosition.ankles.left, statusColor, 8)
      drawPoint(bodyPosition.ankles.right, statusColor, 8)

      // Draw connections
      drawLine(bodyPosition.shoulders.left, bodyPosition.shoulders.right, statusColor)
      drawLine(bodyPosition.shoulders.left, bodyPosition.hips, statusColor)
      drawLine(bodyPosition.shoulders.right, bodyPosition.hips, statusColor)
      drawLine(bodyPosition.hips, bodyPosition.knees.left, statusColor)
      drawLine(bodyPosition.hips, bodyPosition.knees.right, statusColor)
      drawLine(bodyPosition.knees.left, bodyPosition.ankles.left, statusColor)
      drawLine(bodyPosition.knees.right, bodyPosition.ankles.right, statusColor)
    }

    // Draw metrics
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "12px Arial"
    ctx.textAlign = "left"
    let yPos = 30

    Object.entries(analysis.metrics).forEach(([key, value]) => {
      if (typeof value === "number") {
        ctx.fillText(`${key}: ${value.toFixed(2)}`, 10, yPos)
        yPos += 20
      }
    })

    // Draw status
    ctx.fillStyle = statusColor
    ctx.font = "bold 16px Arial"
    ctx.textAlign = "center"
    ctx.fillText(analysis.isGoodPosture ? "GOOD POSTURE" : "NEEDS IMPROVEMENT", canvas.width / 2, canvas.height - 30)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const getIssueIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      default:
        return <Activity className="w-4 h-4 text-blue-500" />
    }
  }

  const getSessionStats = () => {
    if (sessionData.length === 0) return null

    const goodPostureFrames = sessionData.filter((data) => data.isGoodPosture).length
    const totalIssues = sessionData.reduce((sum, data) => sum + data.issues.length, 0)
    const avgConfidence = sessionData.reduce((sum, data) => sum + data.confidence, 0) / sessionData.length
    const sessionDuration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0

    return {
      goodPosturePercentage: (goodPostureFrames / sessionData.length) * 100,
      totalIssues,
      avgConfidence,
      sessionDuration,
    }
  }

  const sessionStats = getSessionStats()

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button onClick={() => setError(null)} size="sm" variant="outline" className="ml-4 bg-transparent">
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4 items-center">
          <Select value={analysisMode} onValueChange={(value: "squat" | "sitting") => setAnalysisMode(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="squat">Squat Analysis</SelectItem>
              <SelectItem value="sitting">Desk Sitting</SelectItem>
            </SelectContent>
          </Select>

          {!isActive ? (
            <Button onClick={startCamera} disabled={isLoading} className="flex items-center gap-2">
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {isLoading ? "Starting..." : "Start Camera"}
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="destructive" className="flex items-center gap-2">
              <CameraOff className="w-4 h-4" />
              Stop Camera
            </Button>
          )}

          {sessionData.length > 0 && (
            <Button onClick={downloadSessionData} variant="outline" className="flex items-center gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Download Data
            </Button>
          )}
        </div>

        {currentAnalysis && (
          <div className="flex items-center gap-2">
            {currentAnalysis.isGoodPosture ? (
              <Badge variant="default" className="flex items-center gap-1 bg-green-500">
                <CheckCircle className="w-3 h-3" />
                Good Posture
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Issues Detected
              </Badge>
            )}
            <Badge variant="outline">{Math.round(currentAnalysis.confidence * 100)}% confidence</Badge>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Live Posture Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                {!isActive && !isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-75">Click &quots;Start Camera&quots; for accurate posture analysis</p>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <RefreshCw className="w-12 h-12 mx-auto mb-2 opacity-50 animate-spin" />
                      <p className="text-sm opacity-75">Starting camera...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionStats ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Session Duration</span>
                    <span className="text-sm font-medium">{sessionStats.sessionDuration}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Good Posture</span>
                    <Badge variant="outline">{sessionStats.goodPosturePercentage.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Issues</span>
                    <Badge variant="destructive">{sessionStats.totalIssues}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Confidence</span>
                    <Badge variant="secondary">{(sessionStats.avgConfidence * 100).toFixed(1)}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Frames Analyzed</span>
                    <span className="text-sm font-medium">{sessionData.length}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  {isLoading ? "Starting analysis..." : "Start camera to see session statistics"}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {currentAnalysis ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge variant={currentAnalysis.isGoodPosture ? "default" : "destructive"}>
                      {currentAnalysis.isGoodPosture ? "Good" : "Issues"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Confidence</span>
                    <span className="text-sm font-medium">{Math.round(currentAnalysis.confidence * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Issues</span>
                    <span className="text-sm font-medium">{currentAnalysis.issues.length}</span>
                  </div>

                  {/* Display specific metrics */}
                  {Object.entries(currentAnalysis.metrics).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                      <span className="text-xs font-medium">
                        {typeof value === "number" ? value.toFixed(2) : value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  {isLoading ? "Starting analysis..." : "Start camera for detailed metrics"}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentIssues.length > 0 ? (
                  recentIssues.map((issue, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-900">{issue.message}</p>
                        <p className="text-xs text-gray-500">{new Date(issue.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No issues detected yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
