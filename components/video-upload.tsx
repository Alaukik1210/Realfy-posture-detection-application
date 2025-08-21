"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Upload, Play, Pause, RotateCcw, AlertTriangle, CheckCircle } from "lucide-react"

interface AnalysisResult {
  timestamp: number
  isGoodPosture: boolean
  issues: string[]
  confidence: number
}

export default function VideoUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analysisMode, setAnalysisMode] = useState<"squat" | "sitting">("squat")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file)
      setResults([])
      setAnalysisProgress(0)
    }
  }

  const simulateAnalysis = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)

    // Simulate frame-by-frame analysis
    const totalFrames = 100 // Simulate 100 frames
    const analysisResults: AnalysisResult[] = []

    for (let i = 0; i < totalFrames; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50)) // Simulate processing time

      const timestamp = (i / totalFrames) * 10 // 10 second video simulation
      const issues: string[] = []

      if (analysisMode === "squat") {
        if (Math.random() > 0.8) issues.push("Knee tracking over toe")
        if (Math.random() > 0.9) issues.push("Back angle too acute")
        if (Math.random() > 0.7) issues.push("Insufficient depth")
      } else {
        if (Math.random() > 0.7) issues.push("Excessive neck bend")
        if (Math.random() > 0.8) issues.push("Slouched posture")
        if (Math.random() > 0.9) issues.push("Shoulders misaligned")
      }

      analysisResults.push({
        timestamp,
        isGoodPosture: issues.length === 0,
        issues,
        confidence: Math.random() * 0.3 + 0.7,
      })

      setAnalysisProgress(((i + 1) / totalFrames) * 100)
    }

    setResults(analysisResults)
    setIsAnalyzing(false)
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
    }
  }

  const getCurrentAnalysis = () => {
    if (results.length === 0) return null
    return results.find((result) => Math.abs(result.timestamp - currentTime) < 0.5) || results[0]
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
      {/* Upload Section */}
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

              {selectedFile && (
                <Button onClick={simulateAnalysis} disabled={isAnalyzing} className="flex items-center gap-2">
                  {isAnalyzing ? "Analyzing..." : "Start Analysis"}
                </Button>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />

            {selectedFile && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analyzing frames...</span>
                  <span>{Math.round(analysisProgress)}%</span>
                </div>
                <Progress value={analysisProgress} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video Player and Analysis */}
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
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    controls
                  />

                  {/* Analysis Overlay */}
                  {currentAnalysis && results.length > 0 && (
                    <div className="absolute top-4 left-4 right-4">
                      <div className="bg-black/70 rounded-lg p-3 text-white">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            Frame Analysis ({currentAnalysis.timestamp.toFixed(1)}s)
                          </span>
                          <Badge variant={currentAnalysis.isGoodPosture ? "default" : "destructive"}>
                            {currentAnalysis.isGoodPosture ? "Good" : "Issues"}
                          </Badge>
                        </div>
                        {currentAnalysis.issues.map((issue, index) => (
                          <div key={index} className="text-xs text-yellow-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {issue}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>0s</span>
                      <span>Timeline</span>
                      <span>10s</span>
                    </div>
                    <div className="h-8 bg-gray-200 rounded-lg relative overflow-hidden">
                      {results.map((result, index) => (
                        <div
                          key={index}
                          className={`absolute top-0 h-full ${result.isGoodPosture ? "bg-green-500" : "bg-red-500"}`}
                          style={{
                            left: `${(result.timestamp / 10) * 100}%`,
                            width: `${100 / results.length}%`,
                          }}
                        />
                      ))}
                      {/* Current time indicator */}
                      <div
                        className="absolute top-0 w-1 h-full bg-blue-600 z-10"
                        style={{ left: `${(currentTime / 10) * 100}%` }}
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Analysis Results */}
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
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Current Frame</CardTitle>
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
                  <p className="text-sm text-gray-500 text-center py-4">Upload and analyze a video to see results</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
