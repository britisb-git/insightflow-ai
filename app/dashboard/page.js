'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, LogOut, Sparkles, FileSpreadsheet, Plus } from 'lucide-react'
import { toast } from 'sonner'
import FileUploadDialog from '@/components/FileUploadDialog'
import DatasetList from '@/components/DatasetList'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [datasets, setDatasets] = useState([])
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token) {
      router.push('/auth')
      return
    }

    if (userData) {
      setUser(JSON.parse(userData))
    }

    fetchDatasets()
  }, [])

  const fetchDatasets = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/datasets', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setDatasets(data.datasets || [])
      }
    } catch (error) {
      console.error('Error fetching datasets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    router.push('/')
  }

  const handleUploadSuccess = () => {
    setIsUploadOpen(false)
    fetchDatasets()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-semibold">InsightFlow AI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name || 'User'}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Datasets</h1>
            <p className="text-gray-600">Upload and analyze your Excel files with AI</p>
          </div>
          <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Upload Dataset
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading datasets...</p>
          </div>
        ) : datasets.length === 0 ? (
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="p-12 text-center">
              <FileSpreadsheet className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No datasets yet</h3>
              <p className="text-gray-600 mb-6">Upload your first Excel or CSV file to get started with AI-powered analytics</p>
              <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Your First Dataset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DatasetList datasets={datasets} onRefresh={fetchDatasets} />
        )}
      </div>

      {/* Upload Dialog */}
      <FileUploadDialog 
        open={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  )
}
