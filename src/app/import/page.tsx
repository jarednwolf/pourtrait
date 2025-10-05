'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { track } from '@/lib/utils/track'

const SAMPLE_CSV = `name,producer,vintage,region,country,varietal,type,quantity,purchase_price,purchase_date,personal_rating,personal_notes
Pinot Noir,Willamette Estates,2021,Willamette Valley,USA,"Pinot Noir",red,1,24.99,2024-08-10,8,Weeknight favorite
Sancerre,Domaine Durand,2022,Loire,France,"Sauvignon Blanc",white,2,19.99,2024-09-05,7,Crisp and fresh
`

export default function ImportHelperPage() {
  useEffect(() => {
    track('import_helper_viewed')
  }, [])

  const handleDownload = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pourtrait-sample-import.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ---------------------------------------------------------------------------------
  // Client-side CSV import MVP: upload -> parse -> map columns -> validate -> preview
  // ---------------------------------------------------------------------------------

  type SchemaField = 'name' | 'producer' | 'vintage' | 'region' | 'country' | 'varietal' | 'type' | 'quantity' | 'purchase_price' | 'purchase_date' | 'personal_rating' | 'personal_notes'

  const EXPECTED_FIELDS: SchemaField[] = [
    'name', 'producer', 'vintage', 'region', 'country', 'varietal', 'type', 'quantity', 'purchase_price', 'purchase_date', 'personal_rating', 'personal_notes'
  ]

  const [fileName, setFileName] = useState<string>('')
  // Raw CSV is parsed immediately; no need to persist the string
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<SchemaField, string | ''>>({
    name: 'name',
    producer: 'producer',
    vintage: 'vintage',
    region: 'region',
    country: 'country',
    varietal: 'varietal',
    type: 'type',
    quantity: 'quantity',
    purchase_price: 'purchase_price',
    purchase_date: 'purchase_date',
    personal_rating: 'personal_rating',
    personal_notes: 'personal_notes'
  })
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [validated, setValidated] = useState(false)
  const [previewed, setPreviewed] = useState(false)

  function parseCSV(text: string): { headers: string[]; rows: string[][] } {
    // Minimal RFC4180-friendly parser with quotes handling
    const result: string[][] = []
    let current: string[] = []
    let field = ''
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const next = text[i + 1]
      if (char === '"') {
        if (inQuotes && next === '"') {
          field += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
        continue
      }
      if (char === ',' && !inQuotes) {
        current.push(field)
        field = ''
        continue
      }
      if ((char === '\n' || char === '\r') && !inQuotes) {
        if (field.length > 0 || current.length > 0) {
          current.push(field)
          field = ''
          result.push(current)
          current = []
        }
        continue
      }
      field += char
    }
    if (field.length > 0 || current.length > 0) {
      current.push(field)
      result.push(current)
    }

    const [first, ...rest] = result
    const hdrs = (first || []).map(h => h.trim())
    return { headers: hdrs, rows: rest }
  }

  function onFileSelected(file: File) {
    setFileName(file.name)
    track('import_started', { fileName: file.name })
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      const parsed = parseCSV(text)
      setHeaders(parsed.headers)
      setRows(parsed.rows)
      // Auto-map by header name when possible
      setMapping(prev => {
        const nextMap = { ...prev }
        EXPECTED_FIELDS.forEach(f => {
          const match = parsed.headers.find(h => h.toLowerCase() === f.replace('_', ' ').toLowerCase())
          if (match) {nextMap[f] = match}
        })
        return nextMap
      })
    }
    reader.readAsText(file)
  }

  const mappedRecords = useMemo(() => {
    if (headers.length === 0 || rows.length === 0) {return []}
    const headerIndex: Record<string, number> = {}
    headers.forEach((h, i) => { headerIndex[h] = i })
    return rows.map((r) => {
      const get = (field: SchemaField) => {
        const source = mapping[field]
        if (!source) {return ''}
        const idx = headerIndex[source]
        return idx >= 0 ? (r[idx] || '').trim() : ''
      }
      const varietal = get('varietal') ? get('varietal').split(',').map(s => s.trim()).filter(Boolean) : []
      const type = get('type') as any
      return {
        name: get('name'),
        producer: get('producer'),
        vintage: get('vintage') ? Number(get('vintage')) : undefined,
        region: get('region') || undefined,
        country: get('country') || undefined,
        varietal,
        type,
        quantity: get('quantity') ? Number(get('quantity')) : undefined,
        purchasePrice: get('purchase_price') ? Number(get('purchase_price')) : undefined,
        purchaseDate: get('purchase_date') || undefined,
        personalRating: get('personal_rating') ? Number(get('personal_rating')) : undefined,
        personalNotes: get('personal_notes') || undefined
      }
    })
  }, [headers, rows, mapping])

  function runValidation() {
    const errs: string[] = []
    const allowedTypes = ['red','white','rosé','sparkling','dessert','fortified']
    mappedRecords.forEach((rec, idx) => {
      if (!rec.name || !rec.producer) {
        errs.push(`Row ${idx + 2}: name and producer are required`)
      }
      if (rec.vintage !== undefined && Number.isNaN(rec.vintage)) {
        errs.push(`Row ${idx + 2}: vintage must be a number`)
      }
      if (rec.quantity !== undefined && (Number.isNaN(rec.quantity) || rec.quantity < 0)) {
        errs.push(`Row ${idx + 2}: quantity must be a non-negative number`)
      }
      if (rec.purchasePrice !== undefined && Number.isNaN(rec.purchasePrice)) {
        errs.push(`Row ${idx + 2}: purchase_price must be a number`)
      }
      if (rec.personalRating !== undefined && (rec.personalRating < 1 || rec.personalRating > 10)) {
        errs.push(`Row ${idx + 2}: personal_rating must be between 1 and 10`)
      }
      if (rec.type && !allowedTypes.includes(rec.type)) {
        errs.push(`Row ${idx + 2}: type must be one of ${allowedTypes.join(', ')}`)
      }
    })
    setValidationErrors(errs)
    const ok = errs.length === 0
    setValidated(ok)
    track('import_validated', { ok, errorCount: errs.length })
  }

  const enableWrite = process.env.NEXT_PUBLIC_ENABLE_IMPORT_WRITE === 'true'

  function handleImport() {
    // Feature-gated write; for now log to console
    if (!validated) {runValidation()}
    if (validationErrors.length > 0) {return}
    if (!enableWrite) {
      // eslint-disable-next-line no-console
      console.log('[import] write disabled by flag, preview only', { rows: mappedRecords.length })
      track('import_completed', { rows: mappedRecords.length, write: false })
      alert('Import is disabled in this environment. Preview only.')
      return
    }
    // In a future change, call an API route to write
    track('import_completed', { rows: mappedRecords.length, write: true })
    alert(`Imported ${mappedRecords.length} rows`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>CSV Import Helper</CardTitle>
            <CardDescription>Prepare a CSV to quickly import your cellar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="text-sm text-gray-700">Schema</div>
                <div className="mt-1 text-sm text-gray-600">
                  name, producer, vintage, region, country, varietal (comma-separated), type (red/white/rosé/sparkling/dessert/fortified), quantity, purchase_price, purchase_date (YYYY-MM-DD), personal_rating (1-10), personal_notes
                </div>
                <div className="mt-3">
                  <Button onClick={handleDownload} aria-label="Download sample CSV">Download sample CSV</Button>
                </div>
              </div>

              {/* Upload */}
              <div className="space-y-2" aria-label="Upload CSV">
                <label className="block text-sm font-medium text-gray-700">Upload CSV</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  aria-label="Choose CSV file"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {onFileSelected(f)}
                  }}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {fileName && (
                  <div className="text-xs text-gray-500">{fileName}</div>
                )}
              </div>

              {/* Mapping */}
              {headers.length > 0 && (
                <div className="space-y-2" aria-label="Column mapping">
                  <div className="text-sm font-medium text-gray-700">Map columns</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {EXPECTED_FIELDS.map((field) => (
                      <div key={field} className="flex items-center justify-between gap-3">
                        <label className="text-sm text-gray-700 w-40 capitalize">{field.replace('_',' ')}</label>
                        <select
                          aria-label={`Map ${field}`}
                          value={mapping[field] || ''}
                          onChange={(e) => setMapping(prev => ({ ...prev, [field]: e.target.value }))}
                          className="flex-1 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">—</option>
                          {headers.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validate */}
              {headers.length > 0 && (
                <div className="space-y-2" aria-label="Validate import">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => { runValidation(); setPreviewed(true); }} aria-label="Validate and preview">
                      Validate & Preview
                    </Button>
                    {validated && validationErrors.length === 0 && (
                      <span className="text-sm text-green-700">Validated</span>
                    )}
                  </div>
                  {validationErrors.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-red-700">
                      {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  )}
                </div>
              )}

              {/* Preview */}
              {previewed && (
                <div className="space-y-2" aria-label="Preview table">
                  <div className="text-sm font-medium text-gray-700">Preview</div>
                  <div className="overflow-auto border border-gray-200 rounded-md">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {EXPECTED_FIELDS.map(h => (
                            <th key={h} className="px-3 py-2 text-left font-medium text-gray-700 capitalize whitespace-nowrap">{h.replace('_',' ')}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mappedRecords.slice(0, 5).map((r, idx) => (
                          <tr key={idx} className="odd:bg-white even:bg-gray-50">
                            {EXPECTED_FIELDS.map((f) => (
                              <td key={f} className="px-3 py-2 text-gray-900 whitespace-nowrap">
                                {(() => {
                                  const v: any =
                                    f === 'purchase_price' ? r.purchasePrice :
                                    f === 'purchase_date' ? r.purchaseDate :
                                    f === 'personal_rating' ? r.personalRating :
                                    f === 'personal_notes' ? r.personalNotes :
                                    (r as any)[f]
                                  return Array.isArray(v) ? v.join(', ') : (v ?? '')
                                })()}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleImport} aria-label="Start import">{enableWrite ? 'Import' : 'Simulate Import'}</Button>
                    <span className="text-xs text-gray-500">{mappedRecords.length} rows detected</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Metadata must not be exported in client components. Title is set via layout or Head component.


