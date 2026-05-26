'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'

export default function FileUploadDialog({ open, onClose, onSuccess }) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [file, setFile] = useState(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0])
      }
    }
  })

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/datasets/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Dataset uploaded and analyzed!')
        onSuccess()
        router.push(`/analyze/${data.datasetId}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Upload failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Dataset</DialogTitle>
          <DialogDescription>
            Upload your Excel or CSV file to start analyzing with AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="space-y-2">
                <FileSpreadsheet className="h-12 w-12 text-green-600 mx-auto" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="font-medium">Drop your file here or click to browse</p>
                <p className="text-sm text-gray-500">Supports XLSX, XLS, CSV</p>
              </div>
            )}
          </div>

          {file && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setFile(null)} className="flex-1">
                Change File
              </Button>
              <Button onClick={handleUpload} disabled={isUploading} className="flex-1">
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload & Analyze'
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
