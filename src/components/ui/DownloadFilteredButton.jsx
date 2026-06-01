import { useState } from 'react'

// CSV download of the current filtered rows. Uses the given columns
// (in order) for headers; falls back to keys of the first row.
function toCsv(rows, columns) {
  if (!rows.length) return ''
  const keys = columns?.map((c) => c.key) || Object.keys(rows[0])
  const headers = columns?.map((c) => c.label) || keys
  const escape = (v) => {
    if (v == null) return ''
    const s = String(v)
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers.join(','), ...rows.map((row) => keys.map((k) => escape(row[k])).join(','))].join('\n')
}

export default function DownloadFilteredButton({ rows = [], columns, filename = 'export', label = 'Download filtered' }) {
  const [busy, setBusy] = useState(false)

  const handleClick = () => {
    if (!rows.length) return
    setBusy(true)
    try {
      const csv = toCsv(rows, columns)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      className="btn btn-outline-dark btn-sm"
      onClick={handleClick}
      disabled={busy || rows.length === 0}
      title={rows.length === 0 ? 'No records to download' : `Download ${rows.length} record${rows.length === 1 ? '' : 's'} as CSV`}
    >
      <i className="fas fa-file-download me-1"></i>
      {label} ({rows.length})
    </button>
  )
}
