"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, Menu, X, LogOut, User, BarChart3 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface NavbarProps {
  onAuthClick?: () => void
  onAnalysisClick?: () => void
}

export default function Navbar({ onAuthClick, onAnalysisClick }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    setIsMenuOpen(false)
  }

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Realfy</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Posture Detection</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
              How It Works
            </a>
            <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition-colors">
              Benefits
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </a>
          </div>

          {/* Desktop Auth/User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {user.user_metadata?.full_name || user.email?.split("@")[0]}
                  </Badge>
                </div>
                {onAnalysisClick && (
                  <Button onClick={onAnalysisClick} className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Start Analysis
                  </Button>
                )}
                <Button onClick={handleSignOut} variant="outline" className="flex items-center gap-2 bg-transparent">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={onAuthClick} className="flex items-center gap-2">
                Get Started
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <a
                href="#features"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#benefits"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Benefits
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>

              <div className="pt-4 border-t border-gray-200">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {user.user_metadata?.full_name || user.email?.split("@")[0]}
                      </Badge>
                    </div>
                    {onAnalysisClick && (
                      <Button onClick={onAnalysisClick} className="w-full flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Start Analysis
                      </Button>
                    )}
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      className="w-full flex items-center gap-2 bg-transparent"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button onClick={onAuthClick} className="w-full">
                    Get Started
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
