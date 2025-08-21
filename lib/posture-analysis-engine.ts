export interface PostureMetrics {
  neckAngle: number
  backCurvature: number
  shoulderAlignment: number
  hipAlignment: number
  kneeTracking: number
  squatDepth: number
  overallStability: number
}

export interface PostureIssue {
  type: "critical" | "warning" | "minor" | "good"
  message: string
  severity: number // 1-10 scale
  recommendation: string
  timestamp: number
}

export interface PostureAnalysis {
  isGoodPosture: boolean
  overallScore: number // 0-100 scale
  issues: PostureIssue[]
  metrics: PostureMetrics
  confidence: number
  recommendations: string[]
}

export class PostureAnalysisEngine {
  private frameHistory: PostureMetrics[] = []
  private stabilityWindow = 5 // frames to consider for stability

  analyzeSquatPosture(landmarks: unknown[], frameNumber: number): PostureAnalysis {
    const metrics = this.calculateSquatMetrics()
    const issues: PostureIssue[] = []
    const recommendations: string[] = []

    // Store frame history for stability analysis
    this.frameHistory.push(metrics)
    if (this.frameHistory.length > this.stabilityWindow) {
      this.frameHistory.shift()
    }

    const stability = this.calculateStability()

    // Critical Issues (Safety concerns)
    if (metrics.kneeTracking > 0.15) {
      issues.push({
        type: "critical",
        message: "DANGER: Knee valgus detected - high injury risk!",
        severity: 9,
        recommendation: "Keep knees aligned over toes. Strengthen glutes and hip abductors.",
        timestamp: Date.now(),
      })
      recommendations.push("Focus on knee alignment - imagine pushing the floor apart with your feet")
    }

    if (metrics.backCurvature > 0.4) {
      issues.push({
        type: "critical",
        message: "Excessive forward lean - spine at risk",
        severity: 8,
        recommendation: "Keep chest up and core engaged. Work on ankle mobility.",
        timestamp: Date.now(),
      })
      recommendations.push("Improve ankle flexibility with calf stretches")
    }

    // Warning Issues (Form problems)
    if (metrics.squatDepth < 0.3) {
      issues.push({
        type: "warning",
        message: "Insufficient squat depth for optimal benefits",
        severity: 6,
        recommendation: "Aim to get hips below knee level. Work on hip and ankle mobility.",
        timestamp: Date.now(),
      })
      recommendations.push("Practice bodyweight squats to improve depth")
    }

    if (metrics.shoulderAlignment > 0.1) {
      issues.push({
        type: "warning",
        message: "Uneven shoulder position",
        severity: 5,
        recommendation: "Check for muscle imbalances. Ensure even weight distribution.",
        timestamp: Date.now(),
      })
    }

    // Minor Issues (Optimization)
    if (stability < 0.6) {
      issues.push({
        type: "minor",
        message: "Movement instability detected",
        severity: 3,
        recommendation: "Focus on controlled movement. Strengthen core and stabilizer muscles.",
        timestamp: Date.now(),
      })
    }

    // Good form recognition
    if (metrics.squatDepth > 0.7 && metrics.kneeTracking < 0.05 && metrics.backCurvature < 0.2) {
      issues.push({
        type: "good",
        message: "Excellent squat form! Great depth and alignment.",
        severity: 0,
        recommendation: "Maintain this form. Consider adding weight progression.",
        timestamp: Date.now(),
      })
    }

    const overallScore = this.calculateSquatScore(metrics, issues)
    const isGoodPosture = issues.filter((i) => i.type === "critical").length === 0 && overallScore > 70

    return {
      isGoodPosture,
      overallScore,
      issues,
      metrics,
      confidence: this.calculateConfidence(stability, frameNumber),
      recommendations: [...new Set(recommendations)], // Remove duplicates
    }
  }

  analyzeSittingPosture(landmarks: unknown[], frameNumber: number): PostureAnalysis {
    const metrics = this.calculateSittingMetrics()
    const issues: PostureIssue[] = []
    const recommendations: string[] = []

    // Store frame history
    this.frameHistory.push(metrics)
    if (this.frameHistory.length > this.stabilityWindow) {
      this.frameHistory.shift()
    }

    const stability = this.calculateStability()

    // Critical Issues (Health risks)
    if (metrics.neckAngle > 35) {
      issues.push({
        type: "critical",
        message: "Severe forward head posture - tech neck risk!",
        severity: 9,
        recommendation: "Adjust monitor height. Strengthen deep neck flexors.",
        timestamp: Date.now(),
      })
      recommendations.push("Position screen at eye level to reduce neck strain")
    }

    if (metrics.backCurvature > 0.5) {
      issues.push({
        type: "critical",
        message: "Excessive slouching - spinal health at risk",
        severity: 8,
        recommendation: "Sit back in chair with lumbar support. Strengthen core muscles.",
        timestamp: Date.now(),
      })
      recommendations.push("Use a lumbar support cushion")
    }

    // Warning Issues
    if (metrics.neckAngle > 20 && metrics.neckAngle <= 35) {
      issues.push({
        type: "warning",
        message: "Moderate forward head posture detected",
        severity: 6,
        recommendation: "Adjust screen position and take regular breaks.",
        timestamp: Date.now(),
      })
    }

    if (metrics.shoulderAlignment > 0.08) {
      issues.push({
        type: "warning",
        message: "Shoulder imbalance - check your workspace setup",
        severity: 5,
        recommendation: "Ensure keyboard and mouse are at equal height.",
        timestamp: Date.now(),
      })
      recommendations.push("Adjust chair height and armrest position")
    }

    if (metrics.backCurvature > 0.25 && metrics.backCurvature <= 0.5) {
      issues.push({
        type: "warning",
        message: "Mild slouching detected",
        severity: 4,
        recommendation: "Engage core muscles and sit tall.",
        timestamp: Date.now(),
      })
    }

    // Minor Issues
    if (stability < 0.7) {
      issues.push({
        type: "minor",
        message: "Frequent position changes - consider ergonomic adjustments",
        severity: 2,
        recommendation: "Take regular movement breaks every 30 minutes.",
        timestamp: Date.now(),
      })
    }

    // Good posture recognition
    if (metrics.neckAngle < 15 && metrics.backCurvature < 0.2 && metrics.shoulderAlignment < 0.05) {
      issues.push({
        type: "good",
        message: "Excellent sitting posture! Well aligned spine and neck.",
        severity: 0,
        recommendation: "Maintain this posture. Take breaks to prevent stiffness.",
        timestamp: Date.now(),
      })
    }

    const overallScore = this.calculateSittingScore(metrics, issues)
    const isGoodPosture = issues.filter((i) => i.type === "critical").length === 0 && overallScore > 70

    return {
      isGoodPosture,
      overallScore,
      issues,
      metrics,
      confidence: this.calculateConfidence(stability, frameNumber),
      recommendations: [...new Set(recommendations)],
    }
  }

  private calculateSquatMetrics(): PostureMetrics {
    // Simulate realistic squat metrics based on time and movement patterns
    const time = Date.now()
    const squatCycle = Math.sin(time / 4000) // 8-second squat cycle
    const noise = (Math.random() - 0.5) * 0.1

    // Knee tracking (0 = perfect, 1 = severe valgus)
    const kneeTracking = Math.max(0, Math.abs(squatCycle * 0.3) + noise * 0.5)

    // Squat depth (0 = no depth, 1 = full depth)
    const squatDepth = Math.max(0, Math.min(1, Math.abs(squatCycle) * 0.8 + 0.2))

    // Back curvature (0 = upright, 1 = excessive lean)
    const backCurvature = Math.max(0, squatDepth * 0.4 + noise * 0.3)

    // Shoulder alignment (0 = even, 1 = very uneven)
    const shoulderAlignment = Math.abs(noise * 0.2)

    // Hip alignment
    const hipAlignment = Math.abs(noise * 0.15)

    // Overall stability
    const overallStability = Math.max(0.3, 1 - Math.abs(noise * 2))

    return {
      neckAngle: 0, // Not relevant for squats
      backCurvature,
      shoulderAlignment,
      hipAlignment,
      kneeTracking,
      squatDepth,
      overallStability,
    }
  }

  private calculateSittingMetrics(): PostureMetrics {
    const time = Date.now()
    const postureVariation = Math.sin(time / 6000) // Slower variation for sitting
    const noise = (Math.random() - 0.5) * 0.1

    // Neck angle (0-60 degrees)
    const neckAngle = Math.max(0, Math.min(60, 15 + postureVariation * 20 + noise * 15))

    // Back curvature (0 = straight, 1 = severely slouched)
    const backCurvature = Math.max(0, Math.min(1, 0.2 + Math.abs(postureVariation) * 0.4 + noise * 0.3))

    // Shoulder alignment
    const shoulderAlignment = Math.abs(noise * 0.15)

    // Hip alignment
    const hipAlignment = Math.abs(noise * 0.1)

    // Stability (sitting should be more stable than squatting)
    const overallStability = Math.max(0.5, 1 - Math.abs(noise * 1.5))

    return {
      neckAngle,
      backCurvature,
      shoulderAlignment,
      hipAlignment,
      kneeTracking: 0, // Not relevant for sitting
      squatDepth: 0, // Not relevant for sitting
      overallStability,
    }
  }

  private calculateStability(): number {
    if (this.frameHistory.length < 2) return 0.5

    // Calculate variance in key metrics
    const variances = {
      backCurvature: this.calculateVariance(this.frameHistory.map((f) => f.backCurvature)),
      shoulderAlignment: this.calculateVariance(this.frameHistory.map((f) => f.shoulderAlignment)),
      overallStability: this.calculateVariance(this.frameHistory.map((f) => f.overallStability)),
    }

    const avgVariance = (variances.backCurvature + variances.shoulderAlignment + variances.overallStability) / 3
    return Math.max(0, Math.min(1, 1 - avgVariance * 10))
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const squaredDiffs = values.map((value) => Math.pow(value - mean, 2))
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length
  }

  private calculateSquatScore(metrics: PostureMetrics, issues: PostureIssue[]): number {
    let score = 100

    // Deduct points for issues
    issues.forEach((issue) => {
      score -= issue.severity * 2
    })

    // Bonus for good metrics
    if (metrics.squatDepth > 0.7) score += 10
    if (metrics.kneeTracking < 0.05) score += 15
    if (metrics.backCurvature < 0.2) score += 10
    if (metrics.overallStability > 0.8) score += 5

    return Math.max(0, Math.min(100, score))
  }

  private calculateSittingScore(metrics: PostureMetrics, issues: PostureIssue[]): number {
    let score = 100

    // Deduct points for issues
    issues.forEach((issue) => {
      score -= issue.severity * 2
    })

    // Bonus for good metrics
    if (metrics.neckAngle < 15) score += 15
    if (metrics.backCurvature < 0.2) score += 15
    if (metrics.shoulderAlignment < 0.05) score += 10
    if (metrics.overallStability > 0.8) score += 5

    return Math.max(0, Math.min(100, score))
  }

  private calculateConfidence(stability: number, frameNumber: number): number {
    // Confidence increases with more frames and better stability
    const frameConfidence = Math.min(1, frameNumber / 10) // Max confidence after 10 frames
    const stabilityConfidence = stability

    return (frameConfidence * 0.4 + stabilityConfidence * 0.6) * 0.9 + 0.1 // 10-100% range
  }
}
