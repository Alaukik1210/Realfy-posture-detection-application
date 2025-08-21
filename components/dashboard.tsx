"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Upload, Activity, AlertTriangle, CheckCircle, LogOut, User, BarChart3 } from "lucide-react"
import PoseDetectorMediaPipe from "@/components/pose-detector-mediapipe"
import VideoUpload from "@/components/video-upload"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface AnalysisSession {
  id: string
  session_type: "squat" | "sitting"
  analysis_mode: "webcam" | "upload"
  total_frames: number
  good_posture_frames: number
  total_issues: number
  average_confidence: number
  created_at: string
}

export default function Dashboard() {
  const [activeMode, setActiveMode] = useState<"webcam" | "upload">("webcam")
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  const [loading, setLoading] = useState(true)
  const { user, signOut } = useAuth()

  useEffect(() => {
    if (user) {
      fetchSessions()
    }
  }, [user])

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("analysis_sessions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Error fetching sessions:", error)
      } else {
        setSessions(data || [])
      }
    } catch (error) {
      console.error("Error fetching sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const getOverallStats = () => {
    if (sessions.length === 0) return null

    const totalFrames = sessions.reduce((sum, s) => sum + s.total_frames, 0)
    const totalGoodFrames = sessions.reduce((sum, s) => sum + s.good_posture_frames, 0)
    const avgConfidence = sessions.reduce((sum, s) => sum + s.average_confidence, 0) / sessions.length

    return {
      totalSessions: sessions.length,
      overallAccuracy: totalFrames > 0 ? (totalGoodFrames / totalFrames) * 100 : 0,
      avgConfidence: avgConfidence * 100,
    }
  }

  const stats = getOverallStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Realfy Posture Detection</h1>
            <p className="text-lg text-gray-600">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {user?.email}
            </Badge>
            <Button onClick={signOut} variant="outline" className="flex items-center gap-2 bg-transparent">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSessions}</div>
                <p className="text-xs text-muted-foreground">Analysis sessions completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Posture Accuracy</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overallAccuracy.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Good posture frames</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgConfidence.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Detection confidence</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mode Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Choose Detection Mode</CardTitle>
            <CardDescription>Select how you want to analyze your posture</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as "webcam" | "upload")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="webcam" className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Live Webcam
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Video
                </TabsTrigger>
              </TabsList>

              <TabsContent value="webcam" className="mt-4">
                <PoseDetectorMediaPipe />
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <VideoUpload />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Session History */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Your latest posture analysis sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Activity className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading sessions...</p>
                  </div>
                ) : sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            {session.analysis_mode === "webcam" ? (
                              <Camera className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Upload className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{session.session_type} Analysis</p>
                            <p className="text-sm text-gray-500">
                              {new Date(session.created_at).toLocaleDateString()} at{" "}
                              {new Date(session.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {session.good_posture_frames}/{session.total_frames} frames
                            </p>
                            <p className="text-xs text-gray-500">
                              {((session.good_posture_frames / session.total_frames) * 100).toFixed(1)}% good posture
                            </p>
                          </div>
                          <Badge
                            variant={
                              session.good_posture_frames / session.total_frames > 0.8 ? "default" : "destructive"
                            }
                          >
                            {session.total_issues} issues
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No sessions yet. Start your first analysis!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Posture Rules Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Squat Analysis Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Knee tracking over toe (dangerous)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Back angle less than 150° (poor form)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Hip not going below knee level</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-500" />
                  Desk Sitting Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Neck bend greater than 30° (tech neck)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Slouched back posture</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Shoulders not aligned over hips</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
