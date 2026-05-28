export default function StatCard({ icon, color = 'primary', value, label, extra }) {
  return (
    <div className="card text-center">
      <div className="card-body">
        {icon && <i className={`fas ${icon} fa-2x text-${color} mb-2`}></i>}
        <h3 className={`text-${color}`}>{value}</h3>
        <p className="mb-0 small">{label}</p>
        {extra && <small className="text-muted">{extra}</small>}
      </div>
    </div>
  )
}

export function StatRow({ stats }) {
  const cols = Math.min(stats.length, 6)
  return (
    <div className="row g-3 mb-4">
      {stats.map((s, i) => (
        <div key={i} className={`col-md-${12 / cols}`}>
          <StatCard {...s} />
        </div>
      ))}
    </div>
  )
}
