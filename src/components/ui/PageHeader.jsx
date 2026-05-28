export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h2 className="page-title">{title}</h2>
          {subtitle && <p className="mb-0 text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
