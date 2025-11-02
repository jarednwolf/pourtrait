'use client'

import { useState, useEffect, useRef } from 'react'
import { useDataExport } from '@/hooks/useDataExport'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Alert } from '@/components/ui/Alert'
import { ExportOptions } from '@/lib/services/data-export'

interface ExportStats {
  totalWines: number
  totalConsumptionRecords: number
  hasTasteProfile: boolean
  accountCreated: string
  lastActivity: string
}

export function DataExportPanel() {
  const { initialized } = useAuth()
  const {
    exportData,
    createBackup,
    restoreBackup,
    deleteAllData,
    getExportStats,
    isExporting,
    isRestoring,
    isDeleting,
    error
  } = useDataExport()

  const [stats, setStats] = useState<ExportStats | null>(null)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includePersonalNotes: true,
    includeConsumptionHistory: false,
    includeTasteProfile: false
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!initialized) { return }
    loadStats()
  }, [initialized])

  const loadStats = async () => {
    try {
      const exportStats = await getExportStats()
      setStats(exportStats)
    } catch (err) {
      console.error('Failed to load export stats:', err)
    }
  }

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      await exportData(format, { ...exportOptions, format })
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleBackupCreate = async () => {
    try {
      await createBackup()
    } catch (err) {
      console.error('Backup creation failed:', err)
    }
  }

  const handleBackupRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {return}

    try {
      await restoreBackup(file)
      await loadStats() // Refresh stats after restore
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('Backup restore failed:', err)
    }
  }

  const handleDeleteAllData = async () => {
    if (deleteConfirmation !== 'DELETE_ALL_DATA') {
      return
    }

    try {
      await deleteAllData(deleteConfirmation)
      setShowDeleteConfirm(false)
      setDeleteConfirmation('')
      // Redirect to home or login page after deletion
      window.location.href = '/'
    } catch (err) {
      console.error('Data deletion failed:', err)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Export Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Your Data Overview</h3>
        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-wine-600">{stats.totalWines}</div>
              <div className="text-sm text-gray-600">Wines in Collection</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wine-600">{stats.totalConsumptionRecords}</div>
              <div className="text-sm text-gray-600">Consumption Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wine-600">{stats.hasTasteProfile ? 'Yes' : 'No'}</div>
              <div className="text-sm text-gray-600">Taste Profile</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">Member Since</div>
              <div className="text-sm text-gray-600">
                {stats.accountCreated ? new Date(stats.accountCreated).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </Card>

      {/* Export Options */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Export Your Wine Collection</h3>
        <p className="text-gray-600 mb-4">
          Download your wine inventory in various formats for backup or sharing purposes.
        </p>

        <div className="space-y-4">
          {/* Export Options */}
          <div className="space-y-3">
            <h4 className="font-medium">Export Options</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includePersonalNotes}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includePersonalNotes: e.target.checked
                  }))}
                  className="mr-2"
                />
                Include personal notes and ratings
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeConsumptionHistory}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeConsumptionHistory: e.target.checked
                  }))}
                  className="mr-2"
                />
                Include consumption history
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeTasteProfile}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeTasteProfile: e.target.checked
                  }))}
                  className="mr-2"
                />
                Include taste profile data
              </label>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              variant="outline"
            >
              {isExporting ? <LoadingSpinner size="sm" /> : 'Export as CSV'}
            </Button>
            <Button
              onClick={() => handleExport('json')}
              disabled={isExporting}
              variant="outline"
            >
              {isExporting ? <LoadingSpinner size="sm" /> : 'Export as JSON'}
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              variant="outline"
            >
              {isExporting ? <LoadingSpinner size="sm" /> : 'Export as PDF'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Backup & Restore */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Backup & Restore</h3>
        <p className="text-gray-600 mb-4">
          Create a complete backup of all your data or restore from a previous backup.
        </p>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleBackupCreate}
              disabled={isExporting}
            >
              {isExporting ? <LoadingSpinner size="sm" /> : 'Create Full Backup'}
            </Button>
            
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleBackupRestore}
                disabled={isRestoring}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button
                disabled={isRestoring}
                variant="outline"
              >
                {isRestoring ? <LoadingSpinner size="sm" /> : 'Restore from Backup'}
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <p>• Backups include all wines, taste profile, and consumption history</p>
            <p>• Restoring will replace all current data</p>
            <p>• Only restore backups from trusted sources</p>
          </div>
        </div>
      </Card>

      {/* Data Deletion */}
      <Card className="p-6 border-red-200">
        <h3 className="text-lg font-semibold mb-4 text-red-700">Delete All Data</h3>
        <p className="text-gray-600 mb-4">
          Permanently delete all your data from Pourtrait. This action cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="destructive"
          >
            Delete All My Data
          </Button>
        ) : (
          <div className="space-y-4">
            <Alert variant="error">
              <strong>Warning:</strong> This will permanently delete all your wines, taste profile, 
              consumption history, and account data. This action cannot be undone.
            </Alert>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Type "DELETE_ALL_DATA" to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="DELETE_ALL_DATA"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleDeleteAllData}
                disabled={deleteConfirmation !== 'DELETE_ALL_DATA' || isDeleting}
                variant="destructive"
              >
                {isDeleting ? <LoadingSpinner size="sm" /> : 'Confirm Deletion'}
              </Button>
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmation('')
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}