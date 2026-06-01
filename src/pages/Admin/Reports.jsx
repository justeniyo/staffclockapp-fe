import { useState } from 'react'
import { PageHeader } from '../../components/ui'
import { reportService, triggerDownload } from '../../services'

const REPORTS = [
  { key: 'attendance', label: 'Attendance Report', icon: 'fa-clock', desc: 'Clock in/out records with work hours and break durations' },
  { key: 'shifts', label: 'Shift Report', icon: 'fa-calendar-alt', desc: 'Scheduled, completed, and missed shifts' },
  { key: 'leaves', label: 'Leave Report', icon: 'fa-calendar-check', desc: 'Leave requests with approval status and reviewer notes' },
  { key: 'summary', label: 'Attendance Summary', icon: 'fa-chart-bar', desc: 'Per-employee totals: work hours, break time, days worked' },
]

export default function Reports() {
  const [loading, setLoading] = useState(null)
  const [filters, setFilters] = useState({ startDate: '', endDate: '', format: 'csv' })

  const download = async (type) => {
    setLoading(type)
    try {
      const fn = {
        attendance: reportService.downloadAttendance,
        shifts: reportService.downloadShifts,
        leaves: reportService.downloadLeaves,
        summary: reportService.downloadAttendanceSummary,
      }[type]
      const res = await fn({ ...filters })
      await triggerDownload(res, `${type}-report`)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      <PageHeader title="Export Reports" subtitle="Download attendance, shift, and leave data" />
      <div className="page-content">
        <div className="card mb-4">
          <div className="card-header"><h6 className="mb-0">Filters</h6></div>
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-control" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="col-md-3">
                <label className="form-label">End Date</label>
                <input type="date" className="form-control" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Format</label>
                <select className="form-select" value={filters.format} onChange={e => setFilters(p => ({ ...p, format: e.target.value }))}>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel (.xlsx)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {REPORTS.map(r => (
            <div key={r.key} className="col-md-6">
              <div className="card h-100">
                <div className="card-body d-flex align-items-start gap-3">
                  <i className={`fas ${r.icon} fa-2x text-primary mt-1`}></i>
                  <div className="flex-grow-1">
                    <h6 className="fw-bold mb-1">{r.label}</h6>
                    <p className="text-muted small mb-3">{r.desc}</p>
                    <button className="btn btn-warning btn-sm" onClick={() => download(r.key)} disabled={loading === r.key}>
                      {loading === r.key
                        ? <><i className="fas fa-spinner fa-spin me-1"></i>Exporting...</>
                        : <><i className="fas fa-download me-1"></i>Download {filters.format.toUpperCase()}</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
