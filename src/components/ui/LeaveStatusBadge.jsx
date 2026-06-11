// Unified leave-status badge used everywhere a status needs to be shown.
// Picks an icon + colour from a single map so the look is consistent.
const META = {
  pending:   { icon: 'fa-hourglass-half', label: 'Pending' },
  approved:  { icon: 'fa-check-circle',   label: 'Approved' },
  rejected:  { icon: 'fa-times-circle',   label: 'Rejected' },
  cancelled: { icon: 'fa-ban',            label: 'Cancelled' },
}

export default function LeaveStatusBadge({ status }) {
  const key = (status || '').toLowerCase()
  const meta = META[key] || { icon: 'fa-circle', label: status || 'Unknown' }
  return (
    <span className={`leave-badge ${key}`}>
      <i className={`fas ${meta.icon}`}></i>{meta.label}
    </span>
  )
}
