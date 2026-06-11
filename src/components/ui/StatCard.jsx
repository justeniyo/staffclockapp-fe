export default function StatCard({ icon, color = 'primary', value, label, extra }) {
  return (
    <div className="card text-center stat-card h-100">
      <div className="card-body d-flex flex-column justify-content-center">
        {icon && <i className={`fas ${icon} fa-2x text-${color} mb-2`}></i>}
        <div className={`stat-card-value text-${color}`}>{value}</div>
        <div className="stat-card-label">{label}</div>
        {extra && <small className="stat-card-extra text-muted">{extra}</small>}
      </div>
    </div>
  )
}

export function StatRow({ stats }) {
  // Use a responsive grid: 2 per row on mobile, then 3-6 per row on wider
  // screens. `h-100` on the card + `align-items-stretch` on the row keeps
  // every card the same height even when one has an `extra` line.
  const cols = Math.min(stats.length, 6)
  const lgCol = 12 / cols
  return (
    <div className="row g-3 mb-4 align-items-stretch">
      {stats.map((s, i) => (
        <div key={i} className={`col-6 col-md-4 col-lg-${lgCol}`}>
          <StatCard {...s} />
        </div>
      ))}
    </div>
  )
}
