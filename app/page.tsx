"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Camera, Upload, Activity, AlertTriangle, CheckCircle, Database, Brain, ArrowLeft } from "lucide-react"
import ImprovedPoseDetector from "@/components/improved-pose-detector"
import ImprovedVideoUpload from "@/components/improved-video-upload"
import DatabaseSetup from "@/components/database-setup"
import LandingPage from "@/components/landing-page"
import AuthPage from "@/components/auth-page"
import Navbar from "@/components/navbar"
import { useAuth } from "@/contexts/auth-context"

type AppView = "landing" | "auth" | "analysis"

export default function HomePage() {
  const { user, loading } = useAuth()
  const [currentView, setCurrentView] = useState<AppView>("landing")
  const [activeMode, setActiveMode] = useState<"webcam" | "upload" | "setup">("webcam")

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show landing page if not authenticated
  if (!user && currentView !== "auth") {
    return <LandingPage onAuthClick={() => setCurrentView("auth")} onAnalysisClick={() => setCurrentView("analysis")} />
  }

  // Show auth page
  if (currentView === "auth" && !user) {
    return <AuthPage />
  }

  // Show analysis page for authenticated users
  if (user && currentView === "analysis") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar onAuthClick={() => setCurrentView("auth")} onAnalysisClick={() => setCurrentView("analysis")} />

        <div className="p-4">
          <div className="max-w-6xl mx-auto">
            {/* Back to Landing Button */}
            <div className="mb-6">
              <Button
                onClick={() => setCurrentView("landing")}
                variant="outline"
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Posture Analysis Dashboard</h1>
              <p className="text-lg text-gray-600 mb-4">Advanced AI-powered posture analysis with detailed feedback</p>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  Advanced Analysis
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Real-time Feedback
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  Progress Tracking
                </Badge>
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Choose Analysis Mode</CardTitle>
                <CardDescription>Select how you want to analyze your posture with our advanced engine</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeMode}
                  onValueChange={(value) => setActiveMode(value as "webcam" | "upload" | "setup")}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="webcam" className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Live Analysis
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Video Analysis
                    </TabsTrigger>
                    <TabsTrigger value="setup" className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Database Setup
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="webcam" className="mt-4">
                    <ImprovedPoseDetector />
                  </TabsContent>

                  <TabsContent value="upload" className="mt-4">
                    <ImprovedVideoUpload />
                  </TabsContent>

                  <TabsContent value="setup" className="mt-4">
                    <DatabaseSetup />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Squat Analysis Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Knee valgus detection (injury prevention)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Squat depth analysis (optimal range)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Forward lean assessment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Form progression tracking</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-blue-500" />
                    Sitting Analysis Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Forward head posture (tech neck)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Spinal alignment monitoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Shoulder balance assessment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Ergonomic recommendations</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default: show landing page for authenticated users
  return <LandingPage onAuthClick={() => setCurrentView("auth")} onAnalysisClick={() => setCurrentView("analysis")} />
}
