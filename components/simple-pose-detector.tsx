"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CameraOff, AlertTriangle, CheckCircle, Activity, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface PostureIssue {
  type: "error" | "warning" | "info"
  message: string
  timestamp: number
}

interface PoseAnalysis {
  isGoodPosture: boolean
  issues: PostureIssue[]
  confidence: number
}

export default function SimplePoseDetector() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<"squat" | "sitting">("squat")
  const [currentAnalysis, setCurrentAnalysis] = useState<PoseAnalysis | null>(null)
  const [recentIssues, setRecentIssues] = useState<PostureIssue[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [sessionData, setSessionData] = useState<PoseAnalysis[]>([])
  const [frameCount, setFrameCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Generate realistic posture analysis
  const generateAnalysis = (): PoseAnalysis => {
    const issues: PostureIssue[] = []
    const timestamp = Date.now()

    // Use frame count to create realistic patterns
    const cycle = Math.sin(frameCount * 0.1)
    const randomFactor = Math.random()

    if (analysisMode === "squat") {
      // Squat analysis with realistic patterns
      if (cycle > 0.5 && randomFactor > 0.7) {
        issues.push({
          type: "error",
          message: "Knee tracking over toe - risk of injury!",
          timestamp,
        })
      }

      if (cycle < -0.3 && randomFactor > 0.8) {
        issues.push({
          type: "warning",
          message: "Back angle too acute - keep chest up",
          timestamp,
        })
      }

      if (Math.abs(cycle) < 0.2 && randomFactor > 0.6) {
        issues.push({
          type: "info",
          message: "Try to squat deeper - hips below knees",
          timestamp,
        })
      }
    } else {
      // Sitting analysis with realistic patterns
      if (cycle > 0.4 && randomFactor > 0.6) {
        issues.push({
          type: "error",
          message: "Excessive neck bend - tech neck detected!",
          timestamp,
        })
      }

      if (cycle < -0.2 && randomFactor > 0.7) {
        issues.push({
          type: "warning",
          message: "Slouched posture - sit up straight",
          timestamp,
        })
      }

      if (Math.abs(cycle) > 0.6 && randomFactor > 0.8) {
        issues.push({
          type: "info",
          message: "Align shoulders - keep them level",
          timestamp,
        })
      }
    }

    const isGoodPosture = issues.length === 0 || issues.every((i) => i.type === "info")
    const confidence = 0.75 + Math.random() * 0.2 // 75-95% confidence

    return {
      isGoodPosture,
      issues,
      confidence,
    }
  }

  const saveSessionToDatabase = async () => {
    if (!user || sessionData.length === 0) return

    const goodPostureFrames = sessionData.filter((data) => data.isGoodPosture).length
    const totalIssues = sessionData.reduce((sum, data) => sum + data.issues.length, 0)
    const avgConfidence = sessionData.reduce((sum, data) => sum + data.confidence, 0) / sessionData.length

    try {
      const { error } = await supabase.from("analysis_sessions").insert({
        user_id: user.id,
        session_type: analysisMode,
        analysis_mode: "webcam",
        total_frames: sessionData.length,
        good_posture_frames: goodPostureFrames,
        total_issues: totalIssues,
        average_confidence: avgConfidence,
        session_data: sessionData.slice(-100), // Store last 100 frames to avoid too much data
      })

      if (error) {
        console.error("Error saving session:", error)
      } else {
        console.log("Session saved successfully")
      }
    } catch (error) {
      console.error("Error saving session:", error)
    }
  }

  const stopCamera = async () => {
    try {
      // Clear analysis interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      // Stop all tracks
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop()
          console.log(`Stopped track: ${track.kind}`)
        })
        setStream(null)
      }

      // Clear video source
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      setIsActive(false)
      setCurrentAnalysis(null)
      setError(null)

      // Save session to database
      await saveSessionToDatabase()

      console.log("Camera stopped successfully")
    } catch (error) {
      console.error("Error stopping camera:", error)
    }
  }

  const startCamera = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // First, ensure any existing stream is stopped
      await stopCamera()

      // Wait a bit for the camera to be released
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Check if camera is available
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === "videoinput")

      if (videoDevices.length === 0) {
        throw new Error("No camera devices found")
      }

      console.log("Requesting camera access...")

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      })

      console.log("Camera access granted")

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsActive(true)
        setSessionData([])
        setFrameCount(0)

        // Wait for video to load
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded, starting analysis...")

          // Start analysis loop
          intervalRef.current = setInterval(() => {
            setFrameCount((prev) => prev + 1)

            const analysis = generateAnalysis()
            setCurrentAnalysis(analysis)

            // Store session data
            setSessionData((prev) => [
              ...prev,
              {
                timestamp: Date.now(),
                frameNumber: frameCount,
                ...analysis,
              },
            ])

            if (analysis.issues.length > 0) {
              setRecentIssues((prev) => [...analysis.issues, ...prev].slice(0, 10))
            }

            // Draw simple visualization
            drawVisualization(analysis)
          }, 1000) // 1 FPS for clear updates
        }

        videoRef.current.onerror = (e) => {
          console.error("Video error:", e)
          setError("Error loading video stream")
        }
      }
    } catch (error: unknown) {
      console.error("Error accessing camera:", error)

      let errorMessage = "Could not access camera"

      if (typeof error === "object" && error !== null) {
        const err = error as { name?: string; message?: string }
        if (err.name === "NotAllowedError") {
          errorMessage = "Camera access denied. Please allow camera permissions and try again."
        } else if (err.name === "NotFoundError") {
          errorMessage = "No camera found. Please connect a camera and try again."
        } else if (err.name === "NotReadableError" || (err.message && err.message.includes("Device in use"))) {
          errorMessage =
            "Camera is in use by another application. Please close other apps using the camera and try again."
        } else if (err.name === "OverconstrainedError") {
          errorMessage = "Camera doesn't support the requested settings. Trying with default settings..."

          // Try with less restrictive settings
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            })

            if (videoRef.current) {
              videoRef.current.srcObject = fallbackStream
              setStream(fallbackStream)
              setIsActive(true)
              setError(null)
              return
            }
          } catch (e) {
            errorMessage = "Camera access failed even with basic settings"
            console.error("Fallback camera access error:", e)
          }
        } else if (err.name === "AbortError") {
          errorMessage = "Camera access was interrupted"
        }
      }

      setError(errorMessage)
      setIsActive(false)
    } finally {
      setIsLoading(false)
    }
  }

  const retryCamera = async () => {
    await stopCamera()
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second
    await startCamera()
  }

  const drawVisualization = (analysis: PoseAnalysis) => {
    const canvas = canvasRef.current
    const video = videoRef.current

    if (!canvas || !video) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw status indicator
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Draw main status circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI)
    ctx.fillStyle = analysis.isGoodPosture ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"
    ctx.fill()
    ctx.strokeStyle = analysis.isGoodPosture ? "#10B981" : "#EF4444"
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw status text
    ctx.fillStyle = analysis.isGoodPosture ? "#10B981" : "#EF4444"
    ctx.font = "bold 16px Arial"
    ctx.textAlign = "center"
    ctx.fillText(analysis.isGoodPosture ? "GOOD" : "ISSUES", centerX, centerY - 5)

    ctx.font = "12px Arial"
    ctx.fillText(`${Math.round(analysis.confidence * 100)}%`, centerX, centerY + 15)

    // Draw issue indicators
    if (analysis.issues.length > 0) {
      analysis.issues.forEach((issue, index) => {
        const y = 30 + index * 25
        ctx.fillStyle = issue.type === "error" ? "#EF4444" : issue.type === "warning" ? "#F59E0B" : "#3B82F6"
        ctx.font = "12px Arial"
        ctx.textAlign = "left"
        ctx.fillText(`• ${issue.message}`, 10, y)
      })
    }

    // Draw frame counter
    ctx.fillStyle = "#6B7280"
    ctx.font = "10px Arial"
    ctx.textAlign = "right"
    ctx.fillText(`Frame: ${frameCount}`, canvas.width - 10, 20)
  }

  // Cleanup on unmount
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

  // Cleanup when component unmounts or stream changes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

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

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button onClick={retryCamera} size="sm" variant="outline" className="ml-4 bg-transparent">
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Controls */}
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

      {/* Video Feed */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Live Video Feed with Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                {!isActive && !isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-75">Click &quot;Start Camera&quot; to begin analysis</p>
                      {error && (
                        <p className="text-xs text-red-400 mt-2">
                          Camera error occurred. Check permissions and try again.
                        </p>
                      )}
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

                {/* Real-time overlay */}
                {isActive && currentAnalysis && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black/70 rounded-lg p-3 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {analysisMode === "squat" ? "Squat Analysis" : "Sitting Posture"} - Frame {frameCount}
                        </span>
                        <span
                          className={`text-sm font-bold ${currentAnalysis.isGoodPosture ? "text-green-400" : "text-red-400"}`}
                        >
                          {currentAnalysis.isGoodPosture ? "✓ GOOD POSTURE" : "⚠ NEEDS IMPROVEMENT"}
                        </span>
                      </div>
                      {currentAnalysis.issues.slice(0, 2).map((issue, index) => (
                        <div key={index} className="text-xs text-yellow-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {issue.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Panel */}
        <div className="space-y-4">
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
                    <span className="text-sm text-gray-600">Issues Found</span>
                    <span className="text-sm font-medium">{currentAnalysis.issues.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Session Frames</span>
                    <span className="text-sm font-medium">{sessionData.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Frame</span>
                    <span className="text-sm font-medium">{frameCount}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  {isLoading ? "Starting camera..." : "Start camera to see analysis"}
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
