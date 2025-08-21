"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CameraOff, AlertTriangle, CheckCircle, Activity, RefreshCw, Download, TrendingUp } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { PostureAnalysisEngine, type PostureAnalysis } from "@/lib/posture-analysis-engine"

export default function ImprovedPoseDetector() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<"squat" | "sitting">("sitting")
  const [currentAnalysis, setCurrentAnalysis] = useState<PostureAnalysis | null>(null)
  const [recentIssues, setRecentIssues] = useState<PostureAnalysis["issues"]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  type SessionDataItem = {
    timestamp: number
    frameNumber: number
    overallScore: number
    confidence: number
    isGoodPosture: boolean
    issues: {
      type: string
      message: string
      recommendation: string
      timestamp: number
    }[]
    metrics: Record<string, number>
  }
  const [sessionData, setSessionData] = useState<SessionDataItem[]>([])
  const [frameCount, setFrameCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<number>(0)
  const { user } = useAuth()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const analysisEngine = useRef(new PostureAnalysisEngine())

  const saveSessionLocally = () => {
    if (sessionData.length === 0) return

    const goodPostureFrames = sessionData.filter((data) => data.isGoodPosture).length
    const avgScore = sessionData.reduce((sum, data) => sum + data.overallScore, 0) / sessionData.length
    const criticalIssues = sessionData.reduce(
      (sum, data) => sum + data.issues.filter((i: { type: string; message: string; recommendation: string; timestamp: number }) => i.type === "critical").length,
      0,
    )

    const sessionSummary = {
      userId: user?.id || "anonymous",
      sessionType: analysisMode,
      analysisMode: "webcam",
      startTime: new Date(sessionStartTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: Math.round((Date.now() - sessionStartTime) / 1000),
      totalFrames: sessionData.length,
      goodPostureFrames: goodPostureFrames,
      averageScore: avgScore,
      criticalIssues: criticalIssues,
      goodPosturePercentage: (goodPostureFrames / sessionData.length) * 100,
      sessionData: sessionData.slice(-30), // Last 30 frames
    }

    const existingSessions = JSON.parse(localStorage.getItem("postureAnalysisSessions") || "[]")
    existingSessions.push(sessionSummary)

    if (existingSessions.length > 10) {
      existingSessions.splice(0, existingSessions.length - 10)
    }

    localStorage.setItem("postureAnalysisSessions", JSON.stringify(existingSessions))
    console.log("Session saved locally:", sessionSummary)
  }

  const downloadSessionData = () => {
    if (sessionData.length === 0) return

    const goodPostureFrames = sessionData.filter((data) => data.isGoodPosture).length
    const avgScore = sessionData.reduce((sum, data) => sum + data.overallScore, 0) / sessionData.length

    const sessionSummary = {
      userId: user?.id || "anonymous",
      sessionType: analysisMode,
      analysisMode: "webcam",
      startTime: new Date(sessionStartTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: Math.round((Date.now() - sessionStartTime) / 1000),
      totalFrames: sessionData.length,
      goodPostureFrames: goodPostureFrames,
      averageScore: avgScore,
      goodPosturePercentage: (goodPostureFrames / sessionData.length) * 100,
      detailedAnalysis: sessionData,
    }

    const blob = new Blob([JSON.stringify(sessionSummary, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `posture-analysis-${analysisMode}-${new Date().toISOString().split("T")[0]}.json`
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
        stream.getTracks().forEach((track) => track.stop())
        setStream(null)
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      setIsActive(false)
      setCurrentAnalysis(null)

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
        setRecentIssues([])

        videoRef.current.onloadedmetadata = () => {
          intervalRef.current = setInterval(() => {
            const currentFrame = frameCount + 1
            setFrameCount(currentFrame)

            // Simulate pose landmarks (in real app, this would come from MediaPipe)
            const mockLandmarks = generateMockLandmarks(analysisMode, currentFrame)

            // Analyze posture using the improved engine
            const analysis =
              analysisMode === "squat"
                ? analysisEngine.current.analyzeSquatPosture([mockLandmarks], currentFrame)
                : analysisEngine.current.analyzeSittingPosture([mockLandmarks], currentFrame)

            setCurrentAnalysis(analysis)

            // Store session data
            setSessionData((prev) => [
              ...prev,
              {
                timestamp: Date.now(),
                frameNumber: currentFrame,
                ...analysis,
                metrics: { ...analysis.metrics }, // ensure metrics is a plain object
              },
            ])

            // Update recent issues with more relevant ones
            if (analysis.issues.length > 0) {
              const significantIssues = analysis.issues.filter(
                (issue) => issue.type === "critical" || issue.type === "warning" || issue.type === "good",
              )
              if (significantIssues.length > 0) {
                setRecentIssues((prev) => [...significantIssues, ...prev].slice(0, 10))
              }
            }

            drawVisualization(analysis)
          }, 3000) // 3 seconds between analyses for more stable results
        }
      }
    } catch (error: unknown) {
      console.error("Error accessing camera:", error)
      let errorMessage = "Could not access camera"

      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        typeof (error as { name: unknown }).name === "string"
      ) {
        const errorName = (error as { name: string }).name
        if (errorName === "NotAllowedError") {
          errorMessage = "Camera access denied. Please allow camera permissions."
        } else if (errorName === "NotFoundError") {
          errorMessage = "No camera found. Please connect a camera."
        } else if (
          errorName === "NotReadableError" ||
          ("message" in error &&
            typeof (error as { message: unknown }).message === "string" &&
            (error as { message: string }).message.includes("Device in use"))
        ) {
          errorMessage = "Camera is in use. Please close other apps using the camera."
        }
      }

      setError(errorMessage)
      setIsActive(false)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockLandmarks = (mode: "squat" | "sitting", frame: number) => {
    // Generate more realistic mock landmarks that change over time
    console.log(frame, mode)
    const time = Date.now()
    const variation = Math.sin(time / 5000) * 0.1 // Slower, more realistic movement

    if (mode === "sitting") {
      return {
        head: { x: 0.5 + variation * 0.3, y: 0.15 + Math.abs(variation) * 1.5 },
        neck: { x: 0.5 + variation * 0.2, y: 0.25 },
        shoulders: {
          left: { x: 0.35 + variation * 0.1, y: 0.35 },
          right: { x: 0.65 - variation * 0.1, y: 0.35 + variation * 0.05 },
        },
        spine: { x: 0.5 + variation * 0.25, y: 0.5 },
        hips: { x: 0.5 + variation * 0.05, y: 0.65 },
      }
    } else {
      const squatPhase = Math.sin(time / 6000) * 0.4 + 0.5 // Slower squat cycle
      return {
        head: { x: 0.5, y: 0.2 + squatPhase * 0.1 },
        shoulders: {
          left: { x: 0.4, y: 0.35 + squatPhase * 0.1 },
          right: { x: 0.6, y: 0.35 + squatPhase * 0.1 },
        },
        hips: { x: 0.5, y: 0.5 + squatPhase * 0.15 },
        knees: {
          left: { x: 0.42 + variation * 0.2, y: 0.7 + squatPhase * 0.1 },
          right: { x: 0.58 - variation * 0.2, y: 0.7 + squatPhase * 0.1 },
        },
        ankles: {
          left: { x: 0.4, y: 0.9 },
          right: { x: 0.6, y: 0.9 },
        },
      }
    }
  }

  const drawVisualization = (analysis: PostureAnalysis) => {
    const canvas = canvasRef.current
    const video = videoRef.current

    if (!canvas || !video) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw score indicator
    const scoreColor = analysis.overallScore > 80 ? "#10B981" : analysis.overallScore > 60 ? "#F59E0B" : "#EF4444"

    // Draw score circle
    ctx.beginPath()
    ctx.arc(canvas.width - 80, 80, 40, 0, 2 * Math.PI)
    ctx.fillStyle = `${scoreColor}20`
    ctx.fill()
    ctx.strokeStyle = scoreColor
    ctx.lineWidth = 4
    ctx.stroke()

    // Draw score text
    ctx.fillStyle = scoreColor
    ctx.font = "bold 18px Arial"
    ctx.textAlign = "center"
    ctx.fillText(Math.round(analysis.overallScore).toString(), canvas.width - 80, 85)

    // Draw status text
    ctx.fillStyle = scoreColor
    ctx.font = "bold 20px Arial"
    ctx.textAlign = "center"
    const statusText =
      analysis.overallScore > 80
        ? "EXCELLENT"
        : analysis.overallScore > 60
          ? "GOOD"
          : analysis.overallScore > 40
            ? "NEEDS WORK"
            : "POOR"
    ctx.fillText(statusText, canvas.width / 2, 50)

    // Draw current issues
    const criticalIssues = analysis.issues.filter((i) => i.type === "critical" || i.type === "warning")
    criticalIssues.slice(0, 3).forEach((issue, index) => {
      const y = 100 + index * 30
      const color = issue.type === "critical" ? "#EF4444" : "#F59E0B"

      ctx.fillStyle = `${color}80`
      ctx.fillRect(10, y - 20, canvas.width - 20, 25)

      ctx.fillStyle = color
      ctx.font = "14px Arial"
      ctx.textAlign = "left"
      ctx.fillText(`⚠ ${issue.message}`, 15, y - 5)
    })

    // Draw good feedback
    const goodIssues = analysis.issues.filter((i) => i.type === "good")
    if (goodIssues.length > 0) {
      const y = canvas.height - 60
      ctx.fillStyle = "#10B98180"
      ctx.fillRect(10, y - 20, canvas.width - 20, 25)

      ctx.fillStyle = "#10B981"
      ctx.font = "14px Arial"
      ctx.textAlign = "left"
      ctx.fillText(`✓ ${goodIssues[0].message}`, 15, y - 5)
    }
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
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case "good":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Activity className="w-4 h-4 text-blue-500" />
    }
  }

  const getSessionStats = () => {
    if (sessionData.length === 0) return null

    const avgScore = sessionData.reduce((sum, data) => sum + data.overallScore, 0) / sessionData.length
    const goodPostureFrames = sessionData.filter((data) => data.isGoodPosture).length
     const criticalIssues = sessionData.reduce(
      (sum, data) => sum + data.issues.filter((i: { type: string; message: string; recommendation: string; timestamp: number }) => i.type === "critical").length,
      0,
    )
    const sessionDuration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : 0

    return {
      averageScore: avgScore,
      goodPosturePercentage: (goodPostureFrames / sessionData.length) * 100,
      criticalIssues,
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
              {isLoading ? "Starting..." : "Start Analysis"}
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="destructive" className="flex items-center gap-2">
              <CameraOff className="w-4 h-4" />
              Stop Analysis
            </Button>
          )}

          {sessionData.length > 0 && (
            <Button onClick={downloadSessionData} variant="outline" className="flex items-center gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export Data
            </Button>
          )}
        </div>

        {currentAnalysis && (
          <div className="flex items-center gap-2">
            <Badge
              variant={currentAnalysis.overallScore > 80 ? "default" : "destructive"}
              className={currentAnalysis.overallScore > 80 ? "bg-green-500" : ""}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Score: {Math.round(currentAnalysis.overallScore)}
            </Badge>
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
                      <p className="text-sm opacity-75">Start analysis for accurate posture feedback</p>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <RefreshCw className="w-12 h-12 mx-auto mb-2 opacity-50 animate-spin" />
                      <p className="text-sm opacity-75">Initializing analysis engine...</p>
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
              <CardTitle className="text-lg">Session Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionStats ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Score</span>
                    <Badge
                      variant={sessionStats.averageScore > 80 ? "default" : "destructive"}
                      className={sessionStats.averageScore > 80 ? "bg-green-500" : ""}
                    >
                      {Math.round(sessionStats.averageScore)}/100
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Good Posture</span>
                    <Badge variant="outline">{sessionStats.goodPosturePercentage.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Critical Issues</span>
                    <Badge variant={sessionStats.criticalIssues > 0 ? "destructive" : "default"}>
                      {sessionStats.criticalIssues}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="text-sm font-medium">{sessionStats.sessionDuration}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Frames</span>
                    <span className="text-sm font-medium">{sessionData.length}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  {isLoading ? "Preparing analysis..." : "Start analysis to see performance metrics"}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {currentAnalysis ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overall Score</span>
                    <Badge
                      variant={currentAnalysis.overallScore > 80 ? "default" : "destructive"}
                      className={currentAnalysis.overallScore > 80 ? "bg-green-500" : ""}
                    >
                      {Math.round(currentAnalysis.overallScore)}/100
                    </Badge>
                  </div>

                  {analysisMode === "sitting" && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Neck Angle</span>
                        <span className="text-xs font-medium">{currentAnalysis.metrics.neckAngle.toFixed(1)}°</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Back Curvature</span>
                        <span className="text-xs font-medium">
                          {(currentAnalysis.metrics.backCurvature * 100).toFixed(1)}%
                        </span>
                      </div>
                    </>
                  )}

                  {analysisMode === "squat" && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Squat Depth</span>
                        <span className="text-xs font-medium">
                          {(currentAnalysis.metrics.squatDepth * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Knee Tracking</span>
                        <span className="text-xs font-medium">
                          {(currentAnalysis.metrics.kneeTracking * 100).toFixed(1)}%
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Stability</span>
                    <span className="text-xs font-medium">
                      {(currentAnalysis.metrics.overallStability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Start analysis for detailed metrics</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentIssues.length > 0 ? (
                  recentIssues.map((issue, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-900 font-medium">{issue.message}</p>
                        <p className="text-xs text-gray-500">{issue.recommendation}</p>
                        <p className="text-xs text-gray-400">{new Date(issue.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No feedback yet - start analysis</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
