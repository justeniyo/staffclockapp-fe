import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '../../services'

// Tighter poll than before so a manager sees new leave requests quickly.
// Also refresh on tab focus and whenever the user causes a known mutation
// (broadcast via `window.dispatchEvent(new Event('sc:notifications:refresh'))`).
const POLL_INTERVAL_MS = 15_000
const REFRESH_EVENT = 'sc:notifications:refresh'

const readSeenIds = () => {
  try { return new Set(JSON.parse(localStorage.getItem('sc_seen_notifications') || '[]')) }
  catch { return new Set() }
}
const writeSeenIds = (set) => {
  const arr = Array.from(set).slice(-200)
  localStorage.setItem('sc_seen_notifications', JSON.stringify(arr))
}

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const KIND_ICON = {
  leave_pending: 'fa-hourglass-half text-warning',
  leave_submitted: 'fa-paper-plane text-primary',
  leave_approved: 'fa-check-circle text-success',
  leave_rejected: 'fa-times-circle text-danger',
  leave_cancelled: 'fa-ban text-secondary',
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [seenIds, setSeenIds] = useState(() => readSeenIds())
  const ref = useRef(null)

  const fetchNow = useCallback(async () => {
    try {
      const res = await notificationService.list()
      setItems(res?.data?.items || [])
    } catch (err) {
      console.debug('[notifications] fetch failed:', err?.message)
    }
  }, [])

  // 1. Periodic poll.
  useEffect(() => {
    fetchNow()
    const t = setInterval(fetchNow, POLL_INTERVAL_MS)
    return () => clearInterval(t)
  }, [fetchNow])

  // 2. Tab focus / visibility change → fetch immediately.
  useEffect(() => {
    const onFocus = () => fetchNow()
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchNow() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchNow])

  // 3. Custom refresh event — any component can broadcast this after a
  //    mutation that should be reflected in notifications (e.g. submitting
  //    a leave request, approving one, etc.).
  useEffect(() => {
    const handler = () => fetchNow()
    window.addEventListener(REFRESH_EVENT, handler)
    return () => window.removeEventListener(REFRESH_EVENT, handler)
  }, [fetchNow])

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const unreadCount = items.filter((n) => !seenIds.has(n.id)).length

  const markAllRead = () => {
    const updated = new Set(seenIds)
    items.forEach((n) => updated.add(n.id))
    setSeenIds(updated)
    writeSeenIds(updated)
  }

  const onItemClick = (item) => {
    if (!seenIds.has(item.id)) {
      const updated = new Set(seenIds)
      updated.add(item.id)
      setSeenIds(updated)
      writeSeenIds(updated)
    }
    setOpen(false)
    if (item.link) navigate(item.link)
  }

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) {
      fetchNow()                          // pull the latest the instant the user opens it
      if (unreadCount > 0) markAllRead()  // mark seen so the badge resets
    }
  }

  return (
    <div className="position-relative" ref={ref}>
      <button
        type="button"
        className="btn-bell"
        onClick={toggle}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-header">
            <strong>Notifications</strong>
            <button className="btn btn-sm btn-link p-0 text-decoration-none" onClick={fetchNow} title="Refresh">
              <i className="fas fa-rotate-right"></i>
            </button>
          </div>

          <div className="notification-body">
            {items.length === 0 ? (
              <div className="text-center text-muted py-4">
                <i className="fas fa-inbox d-block mb-2" style={{ fontSize: '1.5rem' }}></i>
                <small>No notifications yet.</small>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className="notification-item text-start"
                  onClick={() => onItemClick(n)}
                >
                  <i className={`fas ${KIND_ICON[n.kind] || 'fa-info-circle text-muted'} me-2 mt-1`}></i>
                  <div className="flex-grow-1">
                    <div className="fw-semibold small">{n.title}</div>
                    <div className="text-muted small">{n.body}</div>
                    <div className="text-muted" style={{ fontSize: '.7rem' }}>{timeAgo(n.createdAt)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
