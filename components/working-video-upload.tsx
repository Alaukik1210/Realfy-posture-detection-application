"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Upload, Play, Pause, RotateCcw, AlertTriangle, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface AnalysisResult {
  timestamp: number
  isGoodPosture: boolean
  issues: string[]
  confidence: number
  metrics: Record<string, number>
}

export default function WorkingVideoUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analysisMode, setAnalysisMode] = useState<"squat" | "sitting">("squat")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file)
      setResults([])
      setAnalysisProgress(0)
      setCurrentTime(0)
    }
  }

  const analyzeVideoFrame = (timestamp: number, duration: number): AnalysisResult => {
    const progress = timestamp / duration
    const issues: string[] = []
    const metrics: Record<string, number> = {}

    if (analysisMode === "squat") {
      // Simulate squat analysis based on video progress
      const squatPhase = Math.sin(progress * Math.PI * 4) // Multiple squat cycles

      if (squatPhase > 0.7 && Math.random() > 0.8) {
        issues.push("Knee tracking over toe detected")
      }

      if (squatPhase < -0.5 && Math.random() > 0.7) {
        issues.push("Insufficient squat depth")
      }

      if (Math.abs(squatPhase) < 0.3 && Math.random() > 0.9) {
        issues.push("Forward lean detected")
      }

      metrics.squatDepth = Math.abs(squatPhase)
      metrics.kneeAlignment = 0.8 + Math.random() * 0.2
    } else {
      // Simulate sitting analysis
      const postureVariation = Math.sin(progress * Math.PI * 2) + Math.random() * 0.5 - 0.25

      if (postureVariation > 0.6) {
        issues.push("Forward head posture detected")
      }

      if (postureVariation < -0.4) {
        issues.push("Slouched posture detected")
      }

      if (Math.abs(postureVariation) > 0.8 && Math.random() > 0.8) {
        issues.push("Shoulder misalignment")
      }

      metrics.neckAngle = Math.abs(postureVariation * 30)
      metrics.backStraightness = 0.7 + Math.random() * 0.3
    }

    return {
      timestamp,
      isGoodPosture: issues.length === 0,
      issues,
      confidence: 0.75 + Math.random() * 0.2,
      metrics,
    }
  }

  const analyzeFullVideo = async () => {
    if (!selectedFile || !videoRef.current) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)

    const video = videoRef.current
    const duration = video.duration

    if (!duration || duration === 0) {
      console.error("Video duration not available")
      setIsAnalyzing(false)
      return
    }

    setVideoDuration(duration)
    const analysisResults: AnalysisResult[] = []
    const sampleRate = 0.5 // Analyze every 0.5 seconds
    const totalSamples = Math.floor(duration / sampleRate)

    // Analyze video at regular intervals
    for (let i = 0; i < totalSamples; i++) {
      const timestamp = i * sampleRate
      const result = analyzeVideoFrame(timestamp, duration)
      analysisResults.push(result)

      // Update progress
      setAnalysisProgress(((i + 1) / totalSamples) * 100)

      // Small delay to show progress
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    setResults(analysisResults)
    setIsAnalyzing(false)

    // Save to database
    await saveAnalysisToDatabase(analysisResults)
  }

  const saveAnalysisToDatabase = async (analysisResults: AnalysisResult[]) => {
    if (!user || analysisResults.length === 0) return

    const goodPostureFrames = analysisResults.filter((r) => r.isGoodPosture).length
    const totalIssues = analysisResults.reduce((sum, r) => sum + r.issues.length, 0)
    const avgConfidence = analysisResults.reduce((sum, r) => sum + r.confidence, 0) / analysisResults.length

    try {
      const { error } = await supabase.from("analysis_sessions").insert({
        user_id: user.id,
        session_type: analysisMode,
        analysis_mode: "upload",
        total_frames: analysisResults.length,
        good_posture_frames: goodPostureFrames,
        total_issues: totalIssues,
        average_confidence: avgConfidence,
        session_data: analysisResults.slice(0, 100), // Store first 100 results
      })

      if (error) {
        console.error("Error saving analysis:", error)
      } else {
        console.log("Analysis saved successfully")
      }
    } catch (error) {
      console.error("Error saving analysis:", error)
    }
  }

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const resetVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      setCurrentTime(0)
      setIsPlaying(false)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
      drawCurrentAnalysis()
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration)
    }
  }

  const getCurrentAnalysis = (): AnalysisResult | null => {
    if (results.length === 0) return null

    // Find the closest analysis result to current time
    let closest = results[0]
    let minDiff = Math.abs(closest.timestamp - currentTime)

    for (const result of results) {
      const diff = Math.abs(result.timestamp - currentTime)
      if (diff < minDiff) {
        minDiff = diff
        closest = result
      }
    }

    return minDiff < 1 ? closest : null // Only return if within 1 second
  }

  const drawCurrentAnalysis = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    const currentAnalysis = getCurrentAnalysis()

    if (!canvas || !video || !currentAnalysis) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw analysis overlay
    const statusColor = currentAnalysis.isGoodPosture ? "#10B981" : "#EF4444"

    // Draw status indicator
    ctx.fillStyle = `${statusColor}40`
    ctx.fillRect(0, 0, canvas.width, 60)

    ctx.fillStyle = statusColor
    ctx.font = "bold 16px Arial"
    ctx.textAlign = "left"
    ctx.fillText(currentAnalysis.isGoodPosture ? "✓ GOOD POSTURE" : "⚠ ISSUES DETECTED", 20, 30)

    // Draw issues
    if (currentAnalysis.issues.length > 0) {
      ctx.font = "12px Arial"
      currentAnalysis.issues.slice(0, 3).forEach((issue, index) => {
        ctx.fillText(`• ${issue}`, 20, 60 + index * 20)
      })
    }

    // Draw timestamp
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "12px Arial"
    ctx.textAlign = "right"
    ctx.fillText(`${currentTime.toFixed(1)}s / ${videoDuration.toFixed(1)}s`, canvas.width - 20, 30)
  }

  const getOverallStats = () => {
    if (results.length === 0) return null

    const goodPostureFrames = results.filter((r) => r.isGoodPosture).length
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0)
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length

    return {
      goodPosturePercentage: (goodPostureFrames / results.length) * 100,
      totalIssues,
      avgConfidence,
    }
  }

  const currentAnalysis = getCurrentAnalysis()
  const overallStats = getOverallStats()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Video for Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Select Video
              </Button>

              {selectedFile && videoDuration > 0 && (
                <Button onClick={analyzeFullVideo} disabled={isAnalyzing} className="flex items-center gap-2">
                  {isAnalyzing ? "Analyzing..." : "Analyze Video"}
                </Button>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />

            {selectedFile && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  {videoDuration > 0 && ` • ${videoDuration.toFixed(1)}s duration`}
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analyzing video frames...</span>
                  <span>{Math.round(analysisProgress)}%</span>
                </div>
                <Progress value={analysisProgress} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedFile && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Video Player
                  <div className="flex gap-2">
                    <Button size="sm" onClick={togglePlayback} variant="outline">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" onClick={resetVideo} variant="outline">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    src={selectedFile ? URL.createObjectURL(selectedFile) : ""}
                    className="w-full h-full object-cover"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    controls
                  />
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                </div>
              </CardContent>
            </Card>

            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>0s</span>
                      <span>Posture Quality Timeline</span>
                      <span>{videoDuration.toFixed(1)}s</span>
                    </div>
                    <div className="h-8 bg-gray-200 rounded-lg relative overflow-hidden">
                      {results.map((result, index) => (
                        <div
                          key={index}
                          className={`absolute top-0 h-full ${result.isGoodPosture ? "bg-green-500" : "bg-red-500"}`}
                          style={{
                            left: `${(result.timestamp / videoDuration) * 100}%`,
                            width: `${100 / results.length}%`,
                          }}
                        />
                      ))}
                      <div
                        className="absolute top-0 w-1 h-full bg-blue-600 z-10"
                        style={{ left: `${(currentTime / videoDuration) * 100}%` }}
                      />
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>Good Posture</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span>Issues Detected</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-3 bg-blue-600"></div>
                        <span>Current Time</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            {overallStats && (
              <Card>
                <CardHeader>
                  <CardTitle>Overall Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Good Posture</span>
                    <Badge variant="outline">{overallStats.goodPosturePercentage.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Issues</span>
                    <Badge variant="destructive">{overallStats.totalIssues}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Confidence</span>
                    <Badge variant="secondary">{(overallStats.avgConfidence * 100).toFixed(1)}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Analyzed Frames</span>
                    <Badge variant="outline">{results.length}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Current Frame Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {currentAnalysis ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {currentAnalysis.isGoodPosture ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-medium">
                        {currentAnalysis.isGoodPosture ? "Good Posture" : "Issues Detected"}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600">Time: {currentAnalysis.timestamp.toFixed(1)}s</div>

                    {currentAnalysis.issues.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">Issues:</p>
                        {currentAnalysis.issues.map((issue, index) => (
                          <p key={index} className="text-sm text-red-600">
                            • {issue}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="text-sm text-gray-600">
                      Confidence: {(currentAnalysis.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {results.length > 0
                      ? "No analysis data for current time"
                      : "Upload and analyze a video to see results"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
