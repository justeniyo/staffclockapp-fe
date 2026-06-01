import { useState } from 'react'
import { PageHeader } from '../../components/ui'
import { reportService, triggerDownload } from '../../services'

const REPORTS = [
  { key: 'attendance', label: 'Attendance Report', icon: 'fa-clock',          desc: 'Clock in/out records with total work hours per shift.' },
  { key: 'shifts',     label: 'Shift Report',      icon: 'fa-calendar-alt',   desc: 'Scheduled, completed, and missed shifts.' },
  { key: 'leaves',     label: 'Leave Report',      icon: 'fa-calendar-check', desc: 'Leave requests with approval status and reviewer notes.' },
  { key: 'summary',    label: 'Attendance Summary',icon: 'fa-chart-bar',      desc: 'Per-employee totals: work hours and days worked.' },
]

const downloaderFor = {
  attendance: reportService.downloadAttendance,
  shifts:     reportService.downloadShifts,
  leaves:     reportService.downloadLeaves,
  summary:    reportService.downloadAttendanceSummary,
}

export default function Reports() {
  const [loading, setLoading] = useState(null)
  const [filters, setFilters] = useState({ startDate: '', endDate: '', format: 'csv' })
  const [warning, setWarning] = useState('')

  const download = async (type) => {
    setWarning('')

    // Hard requirement: both dates must be set
    if (!filters.startDate || !filters.endDate) {
      setWarning('Please select both a start and end date before generating a report.')
      return
    }
    if (new Date(filters.endDate) < new Date(filters.startDate)) {
      setWarning('End date must be on or after start date.')
      return
    }

    setLoading(type)
    try {
      const res = await downloaderFor[type]({ ...filters })

      // If the server returned a JSON error instead of a file, surface it
      const contentType = res.headers.get('Content-Type') || ''
      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || data.error || 'Report generation failed')
      }

      await triggerDownload(res, `${type}-report`)
    } catch (err) {
      setWarning(err.message || 'Download failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const datesValid = filters.startDate && filters.endDate

  return (
    <div>
      <PageHeader title="Export Reports" subtitle="Download attendance, shift, and leave data" />
      <div className="page-content">
        {/* Filters */}
        <div className="card mb-4">
          <div className="card-header"><h6 className="mb-0">Filters</h6></div>
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label">Start Date <span className="text-danger">*</span></label>
                <input type="date" className="form-control" value={filters.startDate} required
                  onChange={e => { setFilters(p => ({ ...p, startDate: e.target.value })); setWarning('') }} />
              </div>
              <div className="col-md-4">
                <label className="form-label">End Date <span className="text-danger">*</span></label>
                <input type="date" className="form-control" value={filters.endDate} required
                  onChange={e => { setFilters(p => ({ ...p, endDate: e.target.value })); setWarning('') }} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Format</label>
                <select className="form-select" value={filters.format}
                  onChange={e => setFilters(p => ({ ...p, format: e.target.value }))}>
                  <option value="csv">CSV (.csv)</option>
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="pdf">PDF (.pdf)</option>
                </select>
              </div>
            </div>
            {!datesValid && (
              <small className="text-muted mt-3 d-block">
                <i className="fas fa-info-circle me-1"></i>
                A date range is required to generate reports.
              </small>
            )}
          </div>
        </div>

        {warning && (
          <div className="alert alert-warning d-flex align-items-center">
            <i className="fas fa-exclamation-triangle me-2"></i>{warning}
            <button className="btn-close ms-auto" onClick={() => setWarning('')}></button>
          </div>
        )}

        {/* Report cards */}
        <div className="row g-4">
          {REPORTS.map(r => (
            <div key={r.key} className="col-md-6">
              <div className="card h-100">
                <div className="card-body d-flex align-items-start gap-3">
                  <i className={`fas ${r.icon} fa-2x text-primary mt-1`}></i>
                  <div className="flex-grow-1">
                    <h6 className="fw-bold mb-1">{r.label}</h6>
                    <p className="text-muted small mb-3">{r.desc}</p>
                    <button className="btn btn-warning btn-sm"
                      onClick={() => download(r.key)}
                      disabled={loading === r.key || !datesValid}>
                      {loading === r.key
                        ? <><i className="fas fa-spinner fa-spin me-1"></i>Generating...</>
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
