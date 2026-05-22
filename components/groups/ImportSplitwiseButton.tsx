'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, Loader2, X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import Papa from 'papaparse'

interface Props {
  userId: string
}

interface ParsedExpense {
  date: string
  description: string
  amount: number
  currency: string
  paidBy: string
  splits: { name: string; amount: number }[]
}

export function ImportSplitwiseButton({ userId }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<ParsedExpense[]>([])
  const [groupName, setGroupName] = useState('')
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function parseSplitwiseCSV(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[]
        if (rows.length === 0) {
          toast.error('No data found in file')
          return
        }

        const parsed: ParsedExpense[] = []
        const memberColumns = Object.keys(rows[0]).filter(
          k => !['Date', 'Description', 'Category', 'Cost', 'Currency'].includes(k)
        )

        for (const row of rows) {
          const amount = parseFloat(row['Cost'] ?? '0')
          if (!amount || isNaN(amount) || amount <= 0) continue

          const splits = memberColumns
            .map(name => ({ name, amount: Math.abs(parseFloat(row[name] ?? '0')) }))
            .filter(s => s.amount > 0)

          const paidBy = splits.reduce((max, s) =>
            (parseFloat(row[s.name]) < 0 ? s.name : max), '')

          parsed.push({
            date: row['Date'] ?? new Date().toISOString().split('T')[0],
            description: row['Description'] ?? 'Imported expense',
            amount,
            currency: row['Currency'] ?? 'USD',
            paidBy: (paidBy || memberColumns[0]) ?? 'Unknown',
            splits: splits.filter(s => s.name !== paidBy),
          })
        }

        setPreview(parsed)
        toast.success(`Found ${parsed.length} expenses to import`)
      },
      error: () => toast.error('Failed to parse CSV file'),
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setGroupName(file.name.replace('.csv', '').replace(/_/g, ' '))
    parseSplitwiseCSV(file)
  }

  async function handleImport() {
    if (preview.length === 0 || !groupName.trim()) {
      toast.error('Please select a file and enter a group name')
      return
    }
    setLoading(true)
    setProgress(0)
    const supabase = createClient()

    // Create group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name: groupName, description: 'Imported from Splitwise', created_by: userId })
      .select()
      .single()

    if (groupError || !group) {
      toast.error('Failed to create group')
      setLoading(false)
      return
    }

    // Add creator as admin
    await supabase.from('group_members').insert({ group_id: group.id, user_id: userId, role: 'admin' })

    // Import expenses
    let imported = 0
    for (const exp of preview) {
      const { data: expense } = await supabase
        .from('expenses')
        .insert({
          group_id: group.id,
          description: exp.description,
          amount: exp.amount,
          currency: exp.currency,
          paid_by: userId,
          split_type: 'exact',
          date: exp.date.split('T')[0],
          created_by: userId,
        })
        .select()
        .single()

      if (expense) {
        const splitTotal = exp.splits.reduce((s, sp) => s + sp.amount, 0)
        const payerAmount = exp.amount - splitTotal

        await supabase.from('expense_splits').insert([
          { expense_id: expense.id, user_id: userId, amount: payerAmount, settled: true },
          ...exp.splits.map(sp => ({
            expense_id: expense.id,
            user_id: userId,
            amount: sp.amount,
            settled: false,
          })),
        ])
      }

      imported++
      setProgress(Math.round((imported / preview.length) * 100))
    }

    setLoading(false)
    toast.success(`Imported ${imported} expenses into "${groupName}"!`)
    setOpen(false)
    window.location.href = `/groups/${group.id}`
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Upload className="w-4 h-4 mr-1" /> Import
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import from Splitwise</DialogTitle>
            <DialogDescription>
              Export your data from Splitwise (Account → Export) and upload the CSV here.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              {fileName ? (
                <p className="text-sm text-indigo-600 font-medium">{fileName}</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 font-medium">Click to upload Splitwise CSV</p>
                  <p className="text-xs text-gray-400 mt-1">Drag & drop or click to browse</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {preview.length > 0 && (
              <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                  <p className="text-sm font-medium text-indigo-700">{preview.length} expenses ready to import</p>
                </div>
                <div>
                  <label className="text-xs text-indigo-600 font-medium">Group name</label>
                  <input
                    className="mt-1 w-full border border-indigo-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="Group name"
                  />
                </div>
              </div>
            )}

            {loading && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Importing… {progress}%</p>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setOpen(false); setPreview([]); setFileName('') }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleImport}
                disabled={loading || preview.length === 0}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Import {preview.length > 0 ? `${preview.length} expenses` : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
