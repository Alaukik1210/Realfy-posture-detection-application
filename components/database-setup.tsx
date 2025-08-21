"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react"

export default function DatabaseSetup() {
  const [isSetupRunning, setIsSetupRunning] = useState(false)
  const [setupResult, setSetupResult] = useState<{ success: boolean; message: string } | null>(null)

  const runDatabaseSetup = async () => {
    setIsSetupRunning(true)
    setSetupResult(null)

    try {
      const response = await fetch("/api/setup-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()
      setSetupResult(result)
    } catch (error: unknown) {
      let message = "An unknown error occurred";
      if (error instanceof Error) {
        message = error.message;
      }
      setSetupResult({
        success: false,
        message: `Setup failed: ${message}`,
      })
    } finally {
      setIsSetupRunning(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Click the button below to set up the required database tables for storing analysis sessions.
        </p>

        <Button onClick={runDatabaseSetup} disabled={isSetupRunning} className="w-full flex items-center gap-2">
          {isSetupRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Setting up database...
            </>
          ) : (
            <>
              <Database className="w-4 h-4" />
              Setup Database
            </>
          )}
        </Button>

        {setupResult && (
          <Alert variant={setupResult.success ? "default" : "destructive"}>
            {setupResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertDescription>{setupResult.message}</AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-500">
          <p>
            <strong>Note:</strong> The app works without database setup. Data will be stored locally in your browser and
            can be downloaded as JSON files.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
