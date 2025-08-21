"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, CameraOff, AlertTriangle, CheckCircle, Activity } from "lucide-react"

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

export default function PostureDetector() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<"squat" | "sitting">("squat")
  const [currentAnalysis, setCurrentAnalysis] = useState<PoseAnalysis | null>(null)
  const [recentIssues, setRecentIssues] = useState<PostureIssue[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)

  // Simulated pose detection and analysis
  const analyzePose = () => {
    const issues: PostureIssue[] = []

    if (analysisMode === "squat") {
      // Simulate squat analysis
      const kneeOverToe = Math.random() > 0.7
      const backAnglePoor = Math.random() > 0.8
      const hipTooHigh = Math.random() > 0.6

      if (kneeOverToe) {
        issues.push({
          type: "error",
          message: "Knee tracking over toe - risk of injury!",
          timestamp: Date.now(),
        })
        // isGoodPosture = false
      }

      if (backAnglePoor) {
        issues.push({
          type: "warning",
          message: "Back angle too acute - keep chest up",
          timestamp: Date.now(),
        })
        // isGoodPosture = false
      }

      if (hipTooHigh) {
        issues.push({
          type: "info",
          message: "Try to squat deeper - hips below knees",
          timestamp: Date.now(),
        })
      }
    } else {
      // Simulate sitting analysis
      const neckBendExcessive = Math.random() > 0.6
      const backSlouchedBad = Math.random() > 0.7
      const shouldersNotAligned = Math.random() > 0.8

      if (neckBendExcessive) {
        issues.push({
          type: "error",
          message: "Excessive neck bend - tech neck detected!",
          timestamp: Date.now(),
        })
      }

      if (backSlouchedBad) {
        issues.push({
          type: "warning",
          message: "Slouched posture - sit up straight",
          timestamp: Date.now(),
        })
      }

      if (shouldersNotAligned) {
        issues.push({
          type: "info",
          message: "Align shoulders over hips",
          timestamp: Date.now(),
        })
      }
    }

    return {
      isGoodPosture: issues.length === 0 || issues.every((i) => i.type === "info"),
      issues,
      confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
    }
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsActive(true)

        // Start pose detection simulation
        const interval = setInterval(() => {
          if (isActive) {
            const analysis = analyzePose() // In real app, pass actual landmarks
            setCurrentAnalysis(analysis)

            if (analysis.issues.length > 0) {
              setRecentIssues((prev) => [...analysis.issues, ...prev].slice(0, 10))
            }
          }
        }, 1000)

        return () => clearInterval(interval)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsActive(false)
    setCurrentAnalysis(null)
  }

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

  // const getIssueColor = (type: string) => {
  //   switch (type) {
  //     case "error":
  //       return "destructive"
  //     case "warning":
  //       return "secondary"
  //     default:
  //       return "outline"
  //   }
  // }

  return (
    <div className="space-y-6">
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
            <Button onClick={startCamera} className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Start Camera
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
              <CardTitle>Live Video Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                {!isActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-75">Click &quot;Start Camera&quot; to begin</p>
                    </div>
                  </div>
                )}

                {/* Real-time overlay */}
                {isActive && currentAnalysis && (
                  <div className="absolute top-4 left-4 right-4">
                    <div className="bg-black/70 rounded-lg p-3 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {analysisMode === "squat" ? "Squat Analysis" : "Sitting Posture"}
                        </span>
                        <span
                          className={`text-sm ${currentAnalysis.isGoodPosture ? "text-green-400" : "text-red-400"}`}
                        >
                          {currentAnalysis.isGoodPosture ? "GOOD" : "NEEDS IMPROVEMENT"}
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
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Start camera to see analysis</p>
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
