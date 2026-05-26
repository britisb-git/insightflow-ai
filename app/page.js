'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, Sparkles, BarChart3, MessageSquare, Share2, FileText, TrendingUp, Brain } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push('/dashboard')
    } else {
      router.push('/auth')
    }
  }

  const features = [
    {
      icon: Upload,
      title: 'Smart Upload',
      description: 'Upload Excel or CSV files with multiple sheets. We automatically detect relationships and data types.'
    },
    {
      icon: Brain,
      title: 'AI Analysis',
      description: 'Our AI instantly analyzes your data structure, detects patterns, and suggests the best visualizations.'
    },
    {
      icon: MessageSquare,
      title: 'Natural Language Queries',
      description: 'Ask questions in plain English. "Show me booking trends" or "Compare cancellations by city".'
    },
    {
      icon: BarChart3,
      title: 'Auto-Generated Dashboards',
      description: 'Get executive-ready dashboards with KPIs, charts, and insights automatically generated.'
    },
    {
      icon: TrendingUp,
      title: 'Predictive Analytics',
      description: 'Forecast trends, detect anomalies, and get actionable recommendations powered by AI.'
    },
    {
      icon: Share2,
      title: 'Share & Export',
      description: 'Export to PDF, PNG, or Excel. Share dashboards with secure links or schedule email reports.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-semibold">InsightFlow AI</span>
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push('/auth')}>Sign In</Button>
                <Button onClick={() => router.push('/auth')}>Get Started</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered Analytics Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Upload Excel.<br />Ask Questions.<br />Get Executive Insights.
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your spreadsheets into intelligent dashboards in seconds. No technical knowledge required.
          </p>
          <div className="flex items-center gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="gap-2">
              <Upload className="h-5 w-5" />
              Start Analyzing Now
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </Button>
          </div>
        </motion.div>

        {/* Demo Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <Card className="overflow-hidden shadow-2xl">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-12">
                <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Upload className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Upload: Q4_Sales_Data.xlsx</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">AI analyzing 3 sheets, 12,847 rows...</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <span className="font-medium">"Show me revenue trends by region"</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Dashboard generated with 8 insights</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything You Need for Data Insights</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powered by advanced AI to understand your data and deliver insights that matter.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Data?</h2>
            <p className="text-xl mb-8 opacity-90">Join thousands of teams making better decisions with AI-powered insights.</p>
            <Button size="lg" variant="secondary" onClick={handleGetStarted} className="gap-2">
              <Upload className="h-5 w-5" />
              Get Started Free
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">InsightFlow AI</span>
            </div>
            <p className="text-gray-600 text-sm">© 2025 InsightFlow AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
