'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, BarChart3, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export default function DatasetList({ datasets, onRefresh }) {
  const router = useRouter()

  const handleDelete = async (datasetId) => {
    if (!confirm('Are you sure you want to delete this dataset?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/datasets/${datasetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        toast.success('Dataset deleted')
        onRefresh()
      } else {
        toast.error('Failed to delete dataset')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {datasets.map((dataset) => (
        <Card key={dataset.datasetId} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <FileSpreadsheet className="h-8 w-8 text-blue-600" />
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(dataset.datasetId)
                }}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
            <CardTitle className="truncate" title={dataset.fileName}>
              {dataset.fileName}
            </CardTitle>
            <CardDescription>
              Uploaded {formatDistanceToNow(new Date(dataset.createdAt), { addSuffix: true })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm mb-4">
              <p className="text-gray-600">
                <span className="font-medium">{dataset.sheets?.length || 0}</span> sheets,{' '}
                <span className="font-medium">
                  {dataset.sheets?.reduce((sum, s) => sum + (s.rowCount || 0), 0) || 0}
                </span>{' '}
                rows
              </p>
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => router.push(`/analyze/${dataset.datasetId}`)}
            >
              <BarChart3 className="h-4 w-4" />
              Analyze
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
