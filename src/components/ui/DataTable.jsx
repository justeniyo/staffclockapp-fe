import { useState, useMemo, useCallback } from 'react'

/**
 * Reusable sortable + paginated data table.
 *
 * Props:
 *   data       - full array of objects
 *   columns    - [{ key, label, render?, sortable? }]
 *   keyField   - unique id field (default 'id')
 *   defaultSort - { key, dir: 'asc'|'desc' }
 *   pageSize   - initial page size (default 25)
 *   emptyIcon  - font-awesome class
 *   emptyText  - message when no data
 *   onClear    - callback for "Clear Filters" button
 */
export default function DataTable({
  data, columns, keyField = 'id',
  defaultSort = { key: null, dir: 'desc' },
  pageSize: initSize = 25, emptyIcon = 'fa-search',
  emptyText = 'No results found.', onClear,
}) {
  const [sort, setSort] = useState(defaultSort)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(initSize)

  const sorted = useMemo(() => {
    if (!sort.key) return data
    return [...data].sort((a, b) => {
      let av = a[sort.key], bv = b[sort.key]
      if (av instanceof Date || sort.key.includes('date') || sort.key.includes('timestamp'))
        { av = new Date(av); bv = new Date(bv) }
      else if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase() }
      return (av < bv ? -1 : av > bv ? 1 : 0) * (sort.dir === 'asc' ? 1 : -1)
    })
  }, [data, sort])

  const totalPages = Math.ceil(sorted.length / size)
  const rows = useMemo(() => sorted.slice((page - 1) * size, page * size), [sorted, page, size])

  const toggleSort = useCallback((key) => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }))
    setPage(1)
  }, [])

  const sortIcon = (key) =>
    sort.key !== key ? 'fas fa-sort text-muted' :
    sort.dir === 'asc' ? 'fas fa-sort-up text-primary' : 'fas fa-sort-down text-primary'

  if (!data.length) return (
    <div className="text-center py-5">
      <i className={`fas ${emptyIcon} fa-3x text-muted mb-3`}></i>
      <p className="text-muted">{emptyText}</p>
      {onClear && <button className="btn btn-outline-primary" onClick={onClear}>Clear Filters</button>}
    </div>
  )

  return (
    <>
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
        <small className="text-muted">
          {(page - 1) * size + 1}–{Math.min(page * size, sorted.length)} of {sorted.length}
        </small>
        <select className="form-select form-select-sm" style={{ width: 'auto' }}
          value={size} onChange={e => { setSize(+e.target.value); setPage(1) }}>
          {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              {columns.map(col => (
                <th key={col.key} role={col.sortable !== false ? 'button' : undefined}
                    onClick={col.sortable !== false ? () => toggleSort(col.key) : undefined}
                    className={col.sortable !== false ? 'user-select-none' : ''}>
                  <div className="d-flex justify-content-between align-items-center">
                    {col.label}
                    {col.sortable !== false && <i className={sortIcon(col.key)}></i>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row[keyField]}>
                {columns.map(col => (
                  <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="d-flex justify-content-center p-3 border-top">
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage(1)} disabled={page === 1}>
                  <i className="fas fa-angle-double-left"></i>
                </button>
              </li>
              <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                  <i className="fas fa-angle-left"></i>
                </button>
              </li>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const n = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
                return (
                  <li key={n} className={`page-item ${page === n ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(n)}>{n}</button>
                  </li>
                )
              })}
              <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                  <i className="fas fa-angle-right"></i>
                </button>
              </li>
              <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
                  <i className="fas fa-angle-double-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}
