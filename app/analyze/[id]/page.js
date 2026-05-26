'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Sparkles, Send, BarChart3, FileSpreadsheet, 
  TrendingUp, MessageSquare, Loader2, ArrowLeft,
  Table as TableIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

export default function AnalyzePage() {
  const router = useRouter()
  const params = useParams()
  const datasetId = params.id

  const [dataset, setDataset] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth')
      return
    }

    fetchDataset()
    fetchChatHistory()
  }, [datasetId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchDataset = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/datasets/${datasetId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setDataset(data.dataset)
      } else {
        toast.error('Failed to load dataset')
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/chat/${datasetId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || isSending) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsSending(true)

    // Add user message immediately
    const userMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          datasetId,
          message: userMessage
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        const aiMsg = {
          role: 'assistant',
          content: data.response.message || JSON.stringify(data.response),
          chart: data.response.chart,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMsg])
      } else {
        toast.error('Failed to get response')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsSending(false)
    }
  }

  const renderChart = (chartData) => {
    if (!chartData || !chartData.type || !chartData.data) return null

    const { type, title, data, xAxis, yAxis } = chartData

    return (
      <div className="my-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-4">{title}</h4>
        <ResponsiveContainer width="100%" height={300}>
          {type === 'bar' && (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={yAxis || 'value'} fill="#3b82f6" />
            </BarChart>
          )}
          {type === 'line' && (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={yAxis || 'value'} stroke="#3b82f6" />
            </LineChart>
          )}
          {type === 'area' && (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey={yAxis || 'value'} fill="#3b82f6" stroke="#3b82f6" />
            </AreaChart>
          )}
          {type === 'pie' && (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={100}
                fill="#3b82f6"
                dataKey={yAxis || 'value'}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!dataset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Dataset not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                <div>
                  <h1 className="font-semibold">{dataset.fileName}</h1>
                  <p className="text-xs text-gray-500">
                    {dataset.sheets?.length} sheets, {dataset.sheets?.reduce((sum, s) => sum + (s.rowCount || 0), 0)} rows
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">AI Analysis Active</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Dataset Info */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Dataset Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sheets */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Sheets</h3>
                <div className="space-y-2">
                  {dataset.sheets?.map((sheet, idx) => (
                    <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
                      <p className="font-medium">{sheet.name}</p>
                      <p className="text-gray-600 text-xs">
                        {sheet.rowCount} rows, {sheet.columns?.length} columns
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* AI Insights */}
              {dataset.analysis && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Key Dimensions</h3>
                    <div className="flex flex-wrap gap-1">
                      {dataset.analysis.dimensions?.slice(0, 5).map((dim, idx) => (
                        <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {dim}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-2">Key Measures</h3>
                    <div className="flex flex-wrap gap-1">
                      {dataset.analysis.measures?.slice(0, 5).map((measure, idx) => (
                        <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          {measure}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-semibold mb-2">Suggested KPIs</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {dataset.analysis.suggestedKPIs?.slice(0, 5).map((kpi, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <TrendingUp className="h-3 w-3 mt-1 text-blue-600" />
                          {kpi}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Main Content - Chat & Analysis */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  AI Chat
                </TabsTrigger>
                <TabsTrigger value="data" className="gap-2">
                  <TableIcon className="h-4 w-4" />
                  Data Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="mt-4">
                <Card className="h-[calc(100vh-280px)] flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-base">Ask questions about your data</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col p-0">
                    {/* Messages */}
                    <ScrollArea className="flex-1 px-6">
                      <div className="space-y-4 pb-4">
                        {messages.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">Start a conversation about your data</p>
                            <div className="mt-4 space-y-2 text-sm text-left max-w-md mx-auto">
                              <p className="font-medium text-gray-700">Try asking:</p>
                              <ul className="space-y-1 text-gray-600">
                                <li>\u2022 "Show me the trends"</li>
                                <li>\u2022 "What are the top 10 items by value?"</li>
                                <li>\u2022 "Compare X and Y"</li>
                                <li>\u2022 "Generate a dashboard"</li>
                              </ul>
                            </div>
                          </div>
                        )}

                        {messages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {msg.role === 'assistant' && (
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="h-4 w-4 text-blue-600" />
                              </div>
                            )}
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                msg.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              {msg.chart && renderChart(msg.chart)}
                            </div>
                          </div>
                        ))}

                        {isSending && (
                          <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                            </div>
                            <div className="bg-gray-100 rounded-lg p-3">
                              <p className="text-sm text-gray-600">Analyzing...</p>
                            </div>
                          </div>
                        )}

                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="border-t p-4">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          placeholder="Ask about your data..."
                          disabled={isSending}
                          className="flex-1"
                        />
                        <Button type="submit" disabled={isSending || !inputMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="data" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Data Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dataset.sheets?.[0]?.preview && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              {dataset.sheets[0].columns?.map((col, idx) => (
                                <th key={idx} className="text-left p-2 font-semibold bg-gray-50">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dataset.sheets[0].preview.map((row, rowIdx) => (
                              <tr key={rowIdx} className="border-b hover:bg-gray-50">
                                {dataset.sheets[0].columns?.map((col, colIdx) => (
                                  <td key={colIdx} className="p-2">
                                    {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
