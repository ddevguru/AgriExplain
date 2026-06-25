"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Cloud, Zap, Leaf, TrendingUp, Lightbulb } from "lucide-react"

const FARMER_CHALLENGES = [
  {
    icon: "💧",
    title: "Water Management",
    problem: "Inconsistent rainfall and unclear irrigation needs",
    solution: "Real-time soil moisture monitoring guides irrigation scheduling",
    impact: "Save 30% water while improving yields",
  },
  {
    icon: "🌾",
    title: "Pest & Disease Control",
    problem: "Crop diseases spread rapidly without early detection",
    solution: "AI-powered sensors detect anomalies before visible symptoms",
    impact: "Reduce crop loss from 25% to less than 5%",
  },
  {
    icon: "🌱",
    title: "Fertilizer Optimization",
    problem: "Over/under fertilization wastes money and harms soil",
    solution: "Smart recommendations based on real-time soil analysis",
    impact: "Reduce input costs by 20-35%",
  },
  {
    icon: "🌞",
    title: "Climate Unpredictability",
    problem: "Uncertain weather makes planning harvests difficult",
    solution: "AI predictions account for weather patterns and micro-climates",
    impact: "Increase yield predictability from 60% to 85%+",
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-sm border-b border-border bg-background/80">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">AgriXplain</span>
          </div>
          <Link href="/login">
            <Button className="bg-primary hover:bg-primary/90">Sign In</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section with Farm Background */}
      <section className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 py-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 -z-10" />

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold text-balance leading-tight">
              Smart Farming for <span className="text-primary">Every Farmer</span>
            </h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto leading-relaxed">
              Transform your farm with real-time sensor monitoring, AI-powered predictions, and actionable insights.
              Maximize yield, minimize costs, and farm smarter.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/login">
              <Button size="lg" className="bg-primary hover:bg-primary/90 px-8 h-12 text-base">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="px-8 h-12 text-base bg-white/50 backdrop-blur hover:bg-white/70 border-primary/20"
              >
                View Demo
              </Button>
            </Link>
          </div>
          <div className="pt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto text-sm">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">87%</p>
              <p className="text-muted-foreground">Avg Yield Increase</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-accent">45k+</p>
              <p className="text-muted-foreground">Active Farmers</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-secondary">12M+</p>
              <p className="text-muted-foreground">Data Points Daily</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery & Solutions Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">Agricultural Solutions Gallery</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how AgriXplain helps farmers tackle real-world challenges with proven techniques and AI insights
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Pest Management */}
            <Card className="overflow-hidden border-primary/20 hover:shadow-2xl hover:border-primary/40 transition-all group">
              <div className="h-48 bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center overflow-hidden relative">
                <img
                  src="/farm-pest-management-detection-using-sensors.jpg"
                  alt="Pest Management"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-2xl font-bold">Early Pest Detection</h3>
                <p className="text-muted-foreground leading-relaxed">
                  AI-powered sensors detect pest infestations before they spread. Real-time alerts enable immediate
                  intervention, reducing crop loss from 25% to less than 5%.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full">Real-time Monitoring</span>
                  <span className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full">AI Detection</span>
                </div>
              </div>
            </Card>

            {/* Water Management */}
            <Card className="overflow-hidden border-blue-200 hover:shadow-2xl hover:border-blue-400 transition-all group">
              <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden relative">
                <img
                  src="/smart-irrigation-water-management-system.jpg"
                  alt="Water Management"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-2xl font-bold">Precision Water Management</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Real-time soil moisture and weather data optimize irrigation schedules. Save 30% water while improving
                  crop yields through intelligent scheduling.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">Water Conservation</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">Cost Savings</span>
                </div>
              </div>
            </Card>

            {/* Soil Health */}
            <Card className="overflow-hidden border-green-200 hover:shadow-2xl hover:border-green-400 transition-all group">
              <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center overflow-hidden relative">
                <img
                  src="/soil-analysis-nutrient-testing-agricultural-lab.jpg"
                  alt="Soil Health"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-2xl font-bold">Smart Soil Analysis</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Monitor soil nutrients, pH levels, and composition in real-time. Optimize fertilizer applications to
                  reduce costs by 20-35% while improving soil health.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">Nutrient Tracking</span>
                  <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">Sustainability</span>
                </div>
              </div>
            </Card>

            {/* Yield Prediction */}
            <Card className="overflow-hidden border-yellow-200 hover:shadow-2xl hover:border-yellow-400 transition-all group">
              <div className="h-48 bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center overflow-hidden relative">
                <img
                  src="/crop-yield-prediction-ai-machine-learning-harvest.jpg"
                  alt="Yield Prediction"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-2xl font-bold">AI Yield Predictions</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Machine learning models predict yields with 85%+ accuracy using real-time data. Plan harvests, manage
                  inventory, and optimize market timing with confidence.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">Forecasting</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">Planning</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-8 rounded-xl border border-primary/20 space-y-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Farmers Trust AgriXplain</h3>
              <p className="text-muted-foreground">
                Join thousands of farmers who have increased productivity and reduced costs
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-3xl font-bold text-primary">45,000+</p>
                <p className="text-sm text-muted-foreground mt-1">Active Farmers</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent">12M+</p>
                <p className="text-sm text-muted-foreground mt-1">Data Points Daily</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-secondary">₹1.2B+</p>
                <p className="text-sm text-muted-foreground mt-1">Cost Savings Generated</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Farmer Problems & Solutions Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">We Solve Farmer Challenges</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AgriXplain addresses the critical pain points farmers face every season
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {FARMER_CHALLENGES.map((challenge, idx) => (
              <Card
                key={idx}
                className="p-6 border-primary/20 hover:shadow-lg hover:border-primary/40 transition-all group cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="text-4xl mb-2">{challenge.icon}</div>
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                        {challenge.title}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-border/50">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">The Problem</p>
                      <p className="text-sm text-foreground mt-1">{challenge.problem}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide">Our Solution</p>
                      <p className="text-sm text-foreground mt-1">{challenge.solution}</p>
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-sm font-semibold text-accent flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        {challenge.impact}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Why Choose AgriXplain?</h2>
            <p className="text-lg text-muted-foreground">Powerful tools designed for modern farming</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-primary/10 hover:border-primary/40 hover:shadow-lg transition-all group">
              <Cloud className="w-12 h-12 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-3">Real-Time Monitoring</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track temperature, humidity, soil moisture, and more with live sensor updates every minute across your
                entire farm.
              </p>
            </Card>

            <Card className="p-8 border-accent/10 hover:border-accent/40 hover:shadow-lg transition-all group">
              <Zap className="w-12 h-12 text-accent mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-3">AI-Powered Predictions</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get accurate yield forecasts, disease risk assessments, and harvest timing predictions powered by
                machine learning.
              </p>
            </Card>

            <Card className="p-8 border-secondary/10 hover:border-secondary/40 hover:shadow-lg transition-all group">
              <Lightbulb className="w-12 h-12 text-secondary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-3">Smart Recommendations</h3>
              <p className="text-muted-foreground leading-relaxed">
                Receive personalized advice on irrigation, fertilization, pest management, and optimal harvesting
                strategies.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Experience AgriXplain</h2>
            <p className="text-lg text-muted-foreground">Try our interactive demo dashboards risk-free</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Link href="/login">
              <Card className="p-10 cursor-pointer hover:shadow-2xl hover:border-primary/50 transition-all group border-primary/10 h-full">
                <div className="space-y-6 h-full flex flex-col">
                  <div className="text-6xl">👨‍🌾</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                      Farmer Dashboard
                    </h3>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      Monitor your fields in real-time. View sensor data, crop predictions, personalized
                      recommendations, and actionable alerts for optimal farm management.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors w-full justify-center bg-transparent"
                  >
                    Explore Demo <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            </Link>

            <Link href="/login">
              <Card className="p-10 cursor-pointer hover:shadow-2xl hover:border-accent/50 transition-all group border-accent/10 h-full">
                <div className="space-y-6 h-full flex flex-col">
                  <div className="text-6xl">👔</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-accent transition-colors">
                      Admin Dashboard
                    </h3>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      Manage multiple farms from one place. Analyze trends, compare performance, and make data-driven
                      decisions across your entire operation.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="group-hover:bg-accent group-hover:text-accent-foreground transition-colors w-full justify-center bg-transparent"
                  >
                    Explore Demo <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-y border-border">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">Ready to Transform Your Farm?</h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of farmers using AgriXplain to optimize their harvest
            </p>
          </div>
          <Link href="/login">
            <Button size="lg" className="bg-primary hover:bg-primary/90 px-10 h-12 text-base">
              Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <Leaf className="w-6 h-6 text-primary" />
              <span className="font-bold">AgriXplain</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering farmers worldwide with AI-driven precision agriculture
            </p>
            <p className="text-xs text-muted-foreground">© 2025 AgriXplain. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
