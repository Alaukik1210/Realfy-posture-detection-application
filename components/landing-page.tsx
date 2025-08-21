"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  Camera,
  Brain,
  Shield,
  TrendingUp,
  CheckCircle,
  Users,
  Target,
  Zap,
  Star,
  ArrowRight,
  Play,
  Download,
} from "lucide-react"
import Navbar from "./navbar"

interface LandingPageProps {
  onAuthClick: () => void
  onAnalysisClick: () => void
}

export default function LandingPage({ onAuthClick, onAnalysisClick }: LandingPageProps) {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-blue-600" />,
      title: "Advanced AI Analysis",
      description: "Our proprietary AI engine analyzes your posture with medical-grade accuracy",
      details: "Uses advanced biomechanical algorithms to detect even subtle posture issues",
    },
    {
      icon: <Camera className="w-8 h-8 text-green-600" />,
      title: "Real-time Feedback",
      description: "Get instant feedback on your posture as you work or exercise",
      details: "Live analysis with immediate corrections and recommendations",
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-purple-600" />,
      title: "Progress Tracking",
      description: "Track your posture improvement over time with detailed analytics",
      details: "Comprehensive reports showing your posture trends and improvements",
    },
    {
      icon: <Shield className="w-8 h-8 text-red-600" />,
      title: "Injury Prevention",
      description: "Prevent injuries with early detection of dangerous posture patterns",
      details: "Identifies high-risk positions before they cause long-term damage",
    },
  ]

  const benefits = [
    {
      icon: <Target className="w-6 h-6 text-blue-600" />,
      title: "Improved Performance",
      description: "Better posture leads to improved athletic performance and reduced fatigue",
    },
    {
      icon: <Shield className="w-6 h-6 text-green-600" />,
      title: "Pain Prevention",
      description: "Avoid back pain, neck strain, and other posture-related health issues",
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      title: "Increased Energy",
      description: "Proper alignment reduces energy waste and improves overall vitality",
    },
    {
      icon: <Users className="w-6 h-6 text-purple-600" />,
      title: "Professional Confidence",
      description: "Good posture projects confidence and professionalism in any setting",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Developer",
      content: "Realfy helped me fix my tech neck in just 2 weeks. The real-time feedback is incredible!",
      rating: 5,
    },
    {
      name: "Mike Chen",
      role: "Personal Trainer",
      content: "I use this with all my clients. The squat analysis is spot-on and prevents injuries.",
      rating: 5,
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Physical Therapist",
      content: "Finally, a tool that provides accurate posture analysis. I recommend it to all my patients.",
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navbar onAuthClick={onAuthClick} onAnalysisClick={onAnalysisClick} />

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 px-4 py-2">
              <Star className="w-4 h-4 mr-2" />
              AI-Powered Posture Analysis
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Perfect Your Posture with
              <span className="text-blue-600 block">Advanced AI Technology</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Get real-time posture analysis, prevent injuries, and improve your health with our cutting-edge AI system.
              Perfect for desk workers, athletes, and anyone who cares about their posture.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={onAuthClick} size="lg" className="text-lg px-8 py-4">
                Start Free Analysis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 bg-transparent">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Hero Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">98%</div>
              <div className="text-gray-600">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">10K+</div>
              <div className="text-gray-600">Users Helped</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">24/7</div>
              <div className="text-gray-600">Real-time Analysis</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">0</div>
              <div className="text-gray-600">Setup Required</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Powerful Features for Perfect Posture</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our advanced AI system provides comprehensive posture analysis with features designed for both beginners
              and professionals.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-300 ${
                    activeFeature === index ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">{feature.icon}</div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-gray-600 mb-2">{feature.description}</p>
                        {activeFeature === index && (
                          <p className="text-sm text-blue-600 font-medium">{feature.details}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    {features[activeFeature].icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{features[activeFeature].title}</h3>
                  <p className="text-gray-600">{features[activeFeature].details}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How Realfy Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in minutes with our simple three-step process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Start Your Camera</h3>
                <p className="text-gray-600">
                  Simply allow camera access and position yourself in front of your device. No special equipment needed.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">2. AI Analysis</h3>
                <p className="text-gray-600">
                  Our advanced AI analyzes your posture in real-time, detecting issues and providing instant feedback.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Improve & Track</h3>
                <p className="text-gray-600">
                  Follow personalized recommendations and track your progress over time with detailed analytics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Analysis Types Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Comprehensive Analysis Types</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you&#39;re working at a desk or exercising, we&#39;ve got you covered
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-6 h-6" />
                  Desk Sitting Analysis
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Perfect for remote workers and office professionals
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Forward head posture detection</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Spinal alignment monitoring</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Shoulder balance assessment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Ergonomic recommendations</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Perfect for:</strong> Remote workers, students, gamers, and anyone who spends long hours at
                    a desk
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  Squat Form Analysis
                </CardTitle>
                <CardDescription className="text-green-100">Ideal for athletes and fitness enthusiasts</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Knee valgus detection (injury prevention)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Squat depth optimization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Forward lean assessment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Form progression tracking</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Perfect for:</strong> Athletes, personal trainers, gym-goers, and anyone doing strength
                    training
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Choose Realfy?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your health and performance with our comprehensive posture solution
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of satisfied users who have improved their posture with Realfy
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">&quots;{testimonial.content}&quots;</p>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start free and upgrade when you&#39;re ready for advanced features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Free</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mt-4">$0</div>
                <p className="text-gray-600">Perfect for getting started</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Basic posture analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Real-time feedback</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>5 sessions per day</span>
                </div>
                <Button onClick={onAuthClick} className="w-full mt-6">
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            <Card className="relative border-2 border-blue-500 shadow-lg">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1">Most Popular</Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mt-4">$9.99</div>
                <p className="text-gray-600">per month</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Advanced AI analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Unlimited sessions</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Progress tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Video analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Detailed reports</span>
                </div>
                <Button onClick={onAuthClick} className="w-full mt-6">
                  Start Pro Trial
                </Button>
              </CardContent>
            </Card>

            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mt-4">Custom</div>
                <p className="text-gray-600">For teams and organizations</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Everything in Pro</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Team management</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>API access</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Priority support</span>
                </div>
                <Button variant="outline" className="w-full mt-6 bg-transparent">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Perfect Your Posture?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of users who have already improved their health and performance with Realfy
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={onAuthClick} size="lg" variant="secondary" className="text-lg px-8 py-4">
              Start Free Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
            >
              <Download className="w-5 h-5 mr-2" />
              Download App
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Realfy</h3>
                  <p className="text-sm text-gray-400">Posture Detection</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Advanced AI-powered posture analysis for better health and performance.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Integrations
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Press
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Realfy. All rights reserved. Made with ❤️ for better posture.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
