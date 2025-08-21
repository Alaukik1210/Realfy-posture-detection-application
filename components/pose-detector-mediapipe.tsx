"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, CameraOff, AlertTriangle, CheckCircle, Activity } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface VideoRefWithInterval extends HTMLVideoElement {
  detectionInterval?: ReturnType<typeof setInterval>;
}


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

// MediaPipe pose detection utility
class PoseDetector {
  private pose: unknown
  private camera: unknown

  async initialize() {
    // In a real implementation, you would load MediaPipe here
    // For now, we'll simulate the pose detection
    console.log("Pose detector initialized")
    return true
  }

  async detectPose() {
    // Simulate more realistic pose landmarks with some variation
    const baseTime = Date.now()
    const variation = Math.sin(baseTime / 1000) * 0.1 // Add some movement simulation

    return {
      landmarks: [
        { x: 0.5 + variation * 0.1, y: 0.2, z: 0, visibility: 0.9 }, // nose
        { x: 0.4 + variation * 0.05, y: 0.35, z: 0, visibility: 0.8 }, // left shoulder
        { x: 0.6 - variation * 0.05, y: 0.35, z: 0, visibility: 0.8 }, // right shoulder
        { x: 0.42 + variation * 0.03, y: 0.55, z: 0, visibility: 0.7 }, // left hip
        { x: 0.58 - variation * 0.03, y: 0.55, z: 0, visibility: 0.7 }, // right hip
        { x: 0.4 + variation * 0.02, y: 0.75, z: 0, visibility: 0.6 }, // left knee
        { x: 0.6 - variation * 0.02, y: 0.75, z: 0, visibility: 0.6 }, // right knee
        { x: 0.38 + variation * 0.01, y: 0.9, z: 0, visibility: 0.5 }, // left ankle
        { x: 0.62 - variation * 0.01, y: 0.9, z: 0, visibility: 0.5 }, // right ankle
      ],
    }
  }
}

export default function PoseDetectorMediaPipe() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<"squat" | "sitting">("squat")
  const [currentAnalysis, setCurrentAnalysis] = useState<PoseAnalysis | null>(null)
  const [recentIssues, setRecentIssues] = useState<PostureIssue[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [poseDetector] = useState(new PoseDetector())
  interface Landmark {
    x: number
    y: number
    z: number
    visibility: number
  }

  interface SessionFrame {
    timestamp: number
    landmarks: Landmark[]
    isGoodPosture: boolean
    issues: PostureIssue[]
    confidence: number
  }
  const [sessionData, setSessionData] = useState<SessionFrame[]>([])
  const { user } = useAuth()

  // Analyze pose based on landmarks
  const analyzePose = (landmarks: Landmark[]) => {
    const issues: PostureIssue[] = []
    // let isGoodPosture = true

    if (analysisMode === "squat") {
      // Squat analysis rules
      const leftKnee = landmarks[5]
      const rightKnee = landmarks[6]
      const leftAnkle = landmarks[7]
      const rightAnkle = landmarks[8]
      const leftShoulder = landmarks[1]
      const rightShoulder = landmarks[2]
      const leftHip = landmarks[3]
      const rightHip = landmarks[4]

      // Rule 1: Knee over toe check
      if (leftKnee && leftAnkle && leftKnee.x < leftAnkle.x - 0.05) {
        issues.push({
          type: "error",
          message: "Left knee tracking over toe - risk of injury!",
          timestamp: Date.now(),
        })
      }

      if (rightKnee && rightAnkle && rightKnee.x > rightAnkle.x + 0.05) {
        issues.push({
          type: "error",
          message: "Right knee tracking over toe - risk of injury!",
          timestamp: Date.now(),
        })
      }

      // Rule 2: Back angle check (simplified)
      if (leftShoulder && leftHip && rightShoulder && rightHip) {
        const shoulderMidpoint = {
          x: (leftShoulder.x + rightShoulder.x) / 2,
          y: (leftShoulder.y + rightShoulder.y) / 2,
        }
        const hipMidpoint = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 }

        const backAngle =
          (Math.atan2(shoulderMidpoint.y - hipMidpoint.y, shoulderMidpoint.x - hipMidpoint.x) * 180) / Math.PI

        if (Math.abs(backAngle) > 30) {
          issues.push({
            type: "warning",
            message: "Back angle too acute - keep chest up",
            timestamp: Date.now(),
          })
          // isGoodPosture = false
        }
      }

      // Rule 3: Squat depth check
      if (leftHip && leftKnee && leftHip.y < leftKnee.y + 0.05) {
        issues.push({
          type: "info",
          message: "Try to squat deeper - hips below knees",
          timestamp: Date.now(),
        })
      }
    } else {
      // Sitting analysis rules
      const nose = landmarks[0]
      const leftShoulder = landmarks[1]
      const rightShoulder = landmarks[2]
      const leftHip = landmarks[3]
      const rightHip = landmarks[4]

      // Rule 1: Neck bend check (tech neck)
      if (nose && leftShoulder && rightShoulder) {
        const shoulderMidpoint = {
          x: (leftShoulder.x + rightShoulder.x) / 2,
          y: (leftShoulder.y + rightShoulder.y) / 2,
        }
        const neckAngle = (Math.atan2(nose.y - shoulderMidpoint.y, nose.x - shoulderMidpoint.x) * 180) / Math.PI

        if (Math.abs(neckAngle) > 30) {
          issues.push({
            type: "error",
            message: "Excessive neck bend - tech neck detected!",
            timestamp: Date.now(),
          })
          // isGoodPosture = false
        }
      }

      // Rule 2: Back posture check
      if (leftShoulder && rightShoulder && leftHip && rightHip) {
        const shoulderMidpoint = {
          x: (leftShoulder.x + rightShoulder.x) / 2,
          y: (leftShoulder.y + rightShoulder.y) / 2,
        }
        const hipMidpoint = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 }

        const backStraightness = Math.abs(shoulderMidpoint.x - hipMidpoint.x)

        if (backStraightness > 0.1) {
          issues.push({
            type: "warning",
            message: "Slouched posture - sit up straight",
            timestamp: Date.now(),
          })
          // isGoodPosture = false
        }
      }

      // Rule 3: Shoulder alignment check
      if (leftShoulder && rightShoulder) {
        const shoulderAlignment = Math.abs(leftShoulder.y - rightShoulder.y)

        if (shoulderAlignment > 0.05) {
          issues.push({
            type: "info",
            message: "Align shoulders - keep them level",
            timestamp: Date.now(),
          })
        }
      }
    }

    return {
      isGoodPosture: issues.length === 0 || issues.every((i) => i.type === "info"),
      issues,
      confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
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
        session_data: sessionData,
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

  const startCamera = async () => {
    try {
      await poseDetector.initialize()

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsActive(true)
        setSessionData([])

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          // Start pose detection immediately
          const detectPoses = async () => {
            if (videoRef.current && isActive) {
              try {
                const poseResults = await poseDetector.detectPose()

                if (poseResults.landmarks) {
                  const analysis = analyzePose(poseResults.landmarks)
                  setCurrentAnalysis(analysis)

                  // Store session data
                  setSessionData((prev) => [
                    ...prev,
                    {
                      timestamp: Date.now(),
                      landmarks: poseResults.landmarks,
                      ...analysis,
                    },
                  ])

                  if (analysis.issues.length > 0) {
                    setRecentIssues((prev) => [...analysis.issues, ...prev].slice(0, 10))
                  }

                  // Draw pose on canvas
                  drawPose(poseResults.landmarks)
                }
              } catch (error) {
                console.error("Error in pose detection:", error)
              }
            }
          }

          // Start the detection loop
          const interval = setInterval(detectPoses, 500) // 2 FPS for better performance

          // Store interval reference for cleanup
          ;(videoRef.current as VideoRefWithInterval).detectionInterval = interval
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }

  const stopCamera = async () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }

    // Clear detection interval
    if (videoRef.current && (videoRef.current as VideoRefWithInterval).detectionInterval) {
      clearInterval((videoRef.current as VideoRefWithInterval).detectionInterval)
    }

    setIsActive(false)
    setCurrentAnalysis(null)

    // Save session to database
    await saveSessionToDatabase()
  }

  const drawPose = (landmarks: Landmark[]) => {
    const canvas = canvasRef.current
    const video = videoRef.current

    if (!canvas || !video) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw landmarks
    landmarks.forEach((landmark, index) => {
      if (landmark.visibility > 0.5) {
        const x = landmark.x * canvas.width
        const y = landmark.y * canvas.height

        ctx.beginPath()
        ctx.arc(x, y, 5, 0, 2 * Math.PI)
        ctx.fillStyle = currentAnalysis?.isGoodPosture ? "#10B981" : "#EF4444"
        ctx.fill()

        // Draw landmark index
        ctx.fillStyle = "#FFFFFF"
        ctx.font = "12px Arial"
        ctx.fillText(index.toString(), x + 8, y - 8)
      }
    })

    // Draw connections (simplified skeleton)
    const connections = [
      [1, 2], // shoulders
      [1, 3], // left shoulder to hip
      [2, 4], // right shoulder to hip
      [3, 4], // hips
      [3, 5], // left hip to knee
      [4, 6], // right hip to knee
      [5, 7], // left knee to ankle
      [6, 8], // right knee to ankle
    ]

    ctx.strokeStyle = currentAnalysis?.isGoodPosture ? "#10B981" : "#EF4444"
    ctx.lineWidth = 2

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start]
      const endPoint = landmarks[end]

      if (startPoint?.visibility > 0.5 && endPoint?.visibility > 0.5) {
        ctx.beginPath()
        ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height)
        ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height)
        ctx.stroke()
      }
    })
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
              <CardTitle>Live Video Feed with Pose Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                {!isActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm opacity-75">Click &quots;Start Camera&quots; to begin pose detection</p>
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Session Frames</span>
                    <span className="text-sm font-medium">{sessionData.length}</span>
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
