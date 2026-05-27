'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'

export default function FileUploadDialog({ open, onClose, onSuccess }) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [files, setFiles] = useState([])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      // Add more permissive accept types
      'application/x-excel': ['.xlsx', '.xls'],
      'application/excel': ['.xlsx', '.xls']
    },
    maxFiles: 10,
    multiple: true,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        toast.error('Some files were rejected. Please upload only Excel or CSV files.')
      }
      if (acceptedFiles.length > 0) {
        setFiles(prev => [...prev, ...acceptedFiles])
      }
    },
    // More permissive - accept files by extension too
    validator: (file) => {
      const validExtensions = ['.xlsx', '.xls', '.csv']
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      
      if (validExtensions.includes(fileExtension)) {
        return null // Valid
      }
      
      return {
        code: 'invalid-file-type',
        message: 'Only Excel (.xlsx, .xls) and CSV files are supported'
      }
    }
  })

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    let uploadedCount = 0
    let lastDatasetId = null

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

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
          lastDatasetId = data.datasetId
          uploadedCount++
          toast.success(`${file.name} uploaded successfully!`)
        } else {
          const error = await response.json()
          toast.error(`${file.name}: ${error.error || 'Upload failed'}`)
        }
      }

      if (uploadedCount > 0) {
        toast.success(`${uploadedCount} file(s) uploaded and analyzed!`)
        onSuccess()
        // Navigate to the last uploaded dataset
        if (lastDatasetId) {
          router.push(`/analyze/${lastDatasetId}`)
        }
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Dataset</DialogTitle>
          <DialogDescription>
            Upload Excel or CSV files to start analyzing with AI (you can upload multiple files)
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
            {files.length > 0 ? (
              <div className="space-y-2">
                <FileSpreadsheet className="h-12 w-12 text-green-600 mx-auto" />
                <p className="font-medium">{files.length} file(s) selected</p>
                <p className="text-sm text-gray-500">
                  {(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB total
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="font-medium">Drop your files here or click to browse</p>
                <p className="text-sm text-gray-500">Supports XLSX, XLS, CSV (multiple files)</p>
              </div>
            )}
          </div>

          {files.length > 0 && (
            <>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2 flex-1">
                      <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium truncate">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setFiles([])} 
                  disabled={isUploading}
                  className="flex-1"
                >
                  Clear All
                </Button>
                <Button onClick={handleUpload} disabled={isUploading} className="flex-1">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    `Upload ${files.length} File(s)`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
