import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getFullName } from '../../config/seedUsers'
import { PageHeader, StatRow, DataTable, ConfirmModal, DownloadFilteredButton } from '../../components/ui'

export default function ManageStaff() {
  const { allUsers, updateStaff, deactivateUser, reactivateUser, locations, departments, saveFilterState, getFilterState, getUserById } = useAuth()

  const saved = getFilterState('admin-manage-staff') || { search: '', department: '', role: '', status: 'active', manager: '' }
  const [filters, setFilters] = useState(saved)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [deactivateReason, setDeactivateReason] = useState('')

  const departmentsList = Object.values(departments).filter(d => d.isActive)
  const managers = Object.entries(allUsers).filter(([, u]) => u.isManager && u.isActive)

  const usersArray = useMemo(() =>
    Object.entries(allUsers).filter(([, u]) => u.role !== 'system').map(([email, u]) => ({
      ...u, email, staffName: getFullName(u),
      managerName: u.managerId && getUserById(u.managerId) ? getFullName(getUserById(u.managerId)) : 'None',
    }))
  , [allUsers, getUserById])

  const filtered = useMemo(() => {
    let arr = usersArray
    if (filters.search) arr = arr.filter(u => u.staffName.toLowerCase().includes(filters.search.toLowerCase()) || u.email.toLowerCase().includes(filters.search.toLowerCase()))
    if (filters.department) arr = arr.filter(u => u.department === filters.department)
    if (filters.role) arr = arr.filter(u => u.role === filters.role)
    if (filters.manager) arr = arr.filter(u => u.managerId == filters.manager)
    if (filters.status === 'active') arr = arr.filter(u => u.isActive)
    else if (filters.status === 'inactive') arr = arr.filter(u => !u.isActive)
    else if (filters.status === 'managers') arr = arr.filter(u => u.isManager)
    return arr
  }, [usersArray, filters])

  const setFilter = useCallback((key, val) => {
    const next = { ...filters, [key]: val }
    setFilters(next)
    saveFilterState('admin-manage-staff', next)
  }, [filters, saveFilterState])

  const clearFilters = () => { const d = { search: '', department: '', role: '', status: 'active', manager: '' }; setFilters(d); saveFilterState('admin-manage-staff', d) }

  const startEdit = (u) => { setEditingUser(u.email); setEditForm({ firstName: u.firstName, lastName: u.lastName, department: u.department, role: u.role, isManager: u.isManager, managerId: u.managerId || '' }) }
  const saveEdit = () => { updateStaff(editingUser, editForm); setEditingUser(null) }
  const cancelEdit = () => setEditingUser(null)

  const stats = useMemo(() => ({
    total: usersArray.length, active: usersArray.filter(u => u.isActive).length,
    inactive: usersArray.filter(u => !u.isActive).length, managers: usersArray.filter(u => u.isManager).length,
  }), [usersArray])

  const roleBadge = (r) => ({ staff: 'bg-primary', admin: 'bg-danger', security: 'bg-warning text-dark', ceo: 'bg-success' }[r] || 'bg-secondary')

  const columns = [
    { key: 'staffName', label: 'Name', render: (u) => editingUser === u.email ? (
      <div className="row g-1"><div className="col-6"><input className="form-control form-control-sm" value={editForm.firstName || ''} onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} /></div>
      <div className="col-6"><input className="form-control form-control-sm" value={editForm.lastName || ''} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} /></div></div>
    ) : (<div><div className="fw-semibold">{u.staffName}</div>{u.isManager && <span className="tag tag-primary">Manager</span>}</div>) },
    { key: 'email', label: 'Contact', render: (u) => <small className="text-muted">{u.email}</small> },
    { key: 'department', label: 'Department', render: (u) => editingUser === u.email ? (
      <select className="form-select form-select-sm" value={editForm.department || ''} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))}>
        <option value="">Select</option>{departmentsList.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
      </select>
    ) : <span className="tag tag-neutral">{u.department}</span> },
    { key: 'role', label: 'Role', render: (u) => editingUser === u.email ? (
      <select className="form-select form-select-sm" value={editForm.role || ''} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}>
        <option value="staff">Staff</option><option value="admin">Admin</option><option value="security">Security</option><option value="ceo">CEO</option>
      </select>
    ) : <span className={`badge ${roleBadge(u.role)}`}>{u.role}</span> },
    { key: 'managerName', label: 'Reports To', render: (u) => <small className="text-muted">{u.managerName}</small> },
    { key: 'status', label: 'Status', sortable: false, render: (u) => (
      <div className="d-flex flex-column gap-1">
        {!u.isActive && <span className="tag tag-danger"><i className="fas fa-circle-xmark"></i>Inactive</span>}
        {u.isClockedIn && u.isActive && <span className="tag tag-success"><i className="fas fa-circle-check"></i>On Duty</span>}
      </div>
    )},
    { key: 'actions', label: 'Actions', sortable: false, render: (u) => editingUser === u.email ? (
      <div className="btn-group btn-group-sm">
        <button className="btn btn-success" onClick={saveEdit}><i className="fas fa-check"></i></button>
        <button className="btn btn-secondary" onClick={cancelEdit}><i className="fas fa-times"></i></button>
      </div>
    ) : (
      <div className="btn-group btn-group-sm">
        <button className="btn btn-outline-primary" onClick={() => startEdit(u)}><i className="fas fa-edit"></i></button>
        {u.isActive
          ? <button className="btn btn-outline-danger" onClick={() => setDeactivateTarget(u)}><i className="fas fa-ban"></i></button>
          : <button className="btn btn-outline-success" onClick={() => reactivateUser(u.email)}><i className="fas fa-user-check"></i></button>}
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Manage Staff" subtitle={`Showing ${filtered.length} of ${usersArray.length} staff members`} />
      <div className="page-content">
        <StatRow stats={[
          { value: stats.total, label: 'Total', color: 'primary' },
          { value: stats.active, label: 'Active', color: 'success' },
          { value: stats.inactive, label: 'Inactive', color: 'danger' },
          { value: stats.managers, label: 'Managers', color: 'info' },
        ]} />

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Filters</h6>
              <button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}><i className="fas fa-times me-1"></i>Clear</button>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-lg-3"><input className="form-control" placeholder="Search name or email..." value={filters.search} onChange={e => setFilter('search', e.target.value)} /></div>
              <div className="col-lg-2"><select className="form-select" value={filters.department} onChange={e => setFilter('department', e.target.value)}><option value="">All Depts</option>{departmentsList.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
              <div className="col-lg-2"><select className="form-select" value={filters.role} onChange={e => setFilter('role', e.target.value)}><option value="">All Roles</option>{['staff','admin','security','ceo'].map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <div className="col-lg-2"><select className="form-select" value={filters.manager} onChange={e => setFilter('manager', e.target.value)}><option value="">All Managers</option>{managers.map(([,m]) => <option key={m.id} value={m.id}>{getFullName(m)}</option>)}</select></div>
              <div className="col-lg-3"><select className="form-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}><option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="managers">Managers Only</option></select></div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Staff Members</h6>
            <DownloadFilteredButton
              rows={filtered}
              filename="staff-list"
              columns={[
                { key: 'staffName', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'role', label: 'Role' },
                { key: 'department', label: 'Department' },
                { key: 'managerName', label: 'Reports To' },
                { key: 'isManager', label: 'Is Manager' },
                { key: 'isActive', label: 'Active' },
                { key: 'jobTitle', label: 'Job Title' },
              ]}
            />
          </div>
          <DataTable data={filtered} columns={columns} keyField="email" defaultSort={{ key: 'staffName', dir: 'asc' }} emptyIcon="fa-users" emptyText="No staff members found." onClear={clearFilters} />
        </div>

        {/* Deactivate Modal */}
        <ConfirmModal show={!!deactivateTarget} title="Deactivate User" icon="fa-exclamation-triangle" variant="danger" confirmText="Deactivate" confirmDisabled={!deactivateReason.trim()}
          onClose={() => { setDeactivateTarget(null); setDeactivateReason('') }}
          onConfirm={async () => { await deactivateUser(deactivateTarget.email); setDeactivateTarget(null); setDeactivateReason('') }}>
          <div className="alert alert-warning"><strong>Warning:</strong> This will deactivate <strong>{deactivateTarget && getFullName(deactivateTarget)}</strong>.</div>
          <label className="form-label">Reason *</label>
          <textarea className="form-control" value={deactivateReason} onChange={e => setDeactivateReason(e.target.value)} rows="3" placeholder="Reason for deactivation..." />
        </ConfirmModal>
      </div>
    </div>
  )
}
