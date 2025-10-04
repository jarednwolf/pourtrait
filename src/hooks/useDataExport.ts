import { useState } from 'react'
import { ExportOptions } from '@/lib/services/data-export'

interface ExportStats {
  totalWines: number
  totalConsumptionRecords: number
  hasTasteProfile: boolean
  accountCreated: string
  lastActivity: string
}

interface UseDataExportReturn {
  exportData: (format: 'csv' | 'json' | 'pdf', options?: ExportOptions) => Promise<void>
  createBackup: () => Promise<void>
  restoreBackup: (backupFile: File) => Promise<void>
  deleteAllData: (confirmation: string) => Promise<void>
  getExportStats: () => Promise<ExportStats>
  isExporting: boolean
  isRestoring: boolean
  isDeleting: boolean
  error: string | null
}

export function useDataExport(): UseDataExportReturn {
  const [isExporting, setIsExporting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportData = async (format: 'csv' | 'json' | 'pdf', options: ExportOptions = { format }) => {
    setIsExporting(true)
    setError(null)

    try {
      const response = await fetch('/api/data/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ format, options })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `wine-export-${Date.now()}.${format}`

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
      throw err
    } finally {
      setIsExporting(false)
    }
  }

  const createBackup = async () => {
    setIsExporting(true)
    setError(null)

    try {
      const response = await fetch('/api/data/backup?action=create', {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Backup creation failed')
      }

      // Download the backup file
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `pourtrait-backup-${Date.now()}.json`

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup creation failed')
      throw err
    } finally {
      setIsExporting(false)
    }
  }

  const restoreBackup = async (backupFile: File) => {
    setIsRestoring(true)
    setError(null)

    try {
      // Read the backup file
      const backupText = await backupFile.text()
      const backupData = JSON.parse(backupText)

      const response = await fetch('/api/data/backup?action=restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ backupData })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Backup restore failed')
      }

      const result = await response.json()
      return result

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup restore failed')
      throw err
    } finally {
      setIsRestoring(false)
    }
  }

  const deleteAllData = async (confirmation: string) => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch('/api/data/backup', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirmDelete: confirmation })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Data deletion failed')
      }

      const result = await response.json()
      return result

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Data deletion failed')
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  const getExportStats = async (): Promise<ExportStats> => {
    setError(null)

    try {
      const response = await fetch('/api/data/export')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get export stats')
      }

      return await response.json()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get export stats')
      throw err
    }
  }

  return {
    exportData,
    createBackup,
    restoreBackup,
    deleteAllData,
    getExportStats,
    isExporting,
    isRestoring,
    isDeleting,
    error
  }
}