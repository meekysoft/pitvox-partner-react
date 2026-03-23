import { useState, useCallback } from 'react'
import { formatRelativeTime } from '../../utils/format.js'

/**
 * Upcoming events card — shows competition rounds the driver is registered for.
 *
 * @param {object} props
 * @param {Array} props.events - From useUpcomingEvents()
 * @param {boolean} [props.isLoading]
 * @param {string} [props.className]
 */
export function UpcomingEvents({ events, isLoading, className, limit = 3 }) {
  if (isLoading) {
    return <div className="pvx-loading">Loading upcoming events...</div>
  }

  if (!events?.length) {
    return null
  }

  const visible = limit ? events.slice(0, limit) : events
  const remaining = events.length - visible.length

  return (
    <div className={`pvx-card ${className || ''}`}>
      <div className="pvx-card-header">
        <h3 className="pvx-card-title">
          <CalendarIcon />
          Upcoming Events
          <span className="pvx-dash-records-count">({events.length})</span>
        </h3>
      </div>
      <div className="pvx-upcoming-list">
        {visible.map((event) => (
          <div
            key={`${event.competitionId}-${event.roundNumber}`}
            className={`pvx-upcoming-item ${event.isNext ? 'pvx-upcoming-item--next' : ''}`}
          >
            <div className="pvx-upcoming-info">
              <span className="pvx-upcoming-comp">{event.competitionName}</span>
              <span className="pvx-upcoming-round">
                Round {event.roundNumber}: {event.track}
              </span>
              {event.serverPassword && (
                <ServerPasswordDisplay
                  password={event.serverPassword}
                  address={event.serverAddress}
                />
              )}
            </div>
            <div className="pvx-upcoming-time">
              <span className="pvx-upcoming-date">
                {new Date(event.startTime).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
              <span className="pvx-upcoming-relative">
                {formatFutureRelative(event.startTime)}
              </span>
              {event.isNext && <span className="pvx-upcoming-badge">Next</span>}
            </div>
          </div>
        ))}
        {remaining > 0 && (
          <div className="pvx-upcoming-remaining">
            +{remaining} more event{remaining !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}

function ServerPasswordDisplay({ password, address }) {
  const [copied, setCopied] = useState(null)

  const handleCopy = useCallback(async (text, field) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(field)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Fallback — ignore if clipboard not available
    }
  }, [])

  return (
    <div className="pvx-server-info">
      {address && (
        <span
          className="pvx-server-detail pvx-server-detail--clickable"
          onClick={() => handleCopy(address, 'address')}
          title="Click to copy server address"
        >
          <ServerIcon /> {address} {copied === 'address' ? <CheckIcon /> : <CopyIcon />}
        </span>
      )}
      <span
        className="pvx-server-detail pvx-server-detail--clickable"
        onClick={() => handleCopy(password, 'password')}
        title="Click to copy server password"
      >
        <LockIcon /> {password} {copied === 'password' ? <CheckIcon /> : <CopyIcon />}
      </span>
    </div>
  )
}

function formatFutureRelative(isoDate) {
  const diffMs = new Date(isoDate).getTime() - Date.now()
  if (diffMs <= 0) return 'Now'

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours < 1) return 'Less than 1 hour'
  if (hours < 24) return `in ${hours}h`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'Tomorrow'
  if (days < 7) return `in ${days} days`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `in ${weeks} week${weeks !== 1 ? 's' : ''}`
  }
  return formatRelativeTime(isoDate) // fallback to date
}

function CalendarIcon() {
  return (
    <svg className="pvx-dash-records-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="pvx-server-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function ServerIcon() {
  return (
    <svg className="pvx-server-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <circle cx="6" cy="6" r="1" /><circle cx="6" cy="18" r="1" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg className="pvx-server-icon pvx-server-icon--action" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="pvx-server-icon pvx-server-icon--action pvx-server-icon--copied" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
