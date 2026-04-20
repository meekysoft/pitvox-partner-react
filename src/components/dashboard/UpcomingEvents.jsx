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
                {event.dediStatus === 'running'
                  ? 'Live now'
                  : event.dediStatus === 'provisioning'
                    ? 'Starting...'
                    : formatFutureRelative(event.startTime)}
              </span>
              {event.dediStatus === 'running' && <span className="pvx-upcoming-badge pvx-upcoming-badge--live">Live</span>}
              {!event.dediStatus && event.isNext && <span className="pvx-upcoming-badge">Next</span>}
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
  const [copied, setCopied] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const joinString = address
    ? password
      ? `join:${address}|${password}`
      : `join:${address}`
    : null

  const handleCopyJoin = useCallback(async () => {
    if (!joinString) return
    try {
      await navigator.clipboard.writeText(joinString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore if clipboard not available
    }
  }, [joinString])

  return (
    <div className="pvx-server-info">
      {joinString && (
        <span
          className="pvx-server-detail pvx-server-detail--clickable"
          onClick={handleCopyJoin}
          title="Copy join string to clipboard"
        >
          <CopyIcon /> {copied ? 'Copied!' : 'Join'}
        </span>
      )}
      {password && (
        <>
          <span
            className="pvx-server-detail pvx-server-detail--clickable"
            onClick={() => setShowPassword((s) => !s)}
            title={showPassword ? 'Hide password' : 'Reveal password'}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </span>
          {showPassword && (
            <span className="pvx-server-detail">
              <LockIcon /> {password}
            </span>
          )}
        </>
      )}
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

function CopyIcon() {
  return (
    <svg className="pvx-server-icon pvx-server-icon--action" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg className="pvx-server-icon pvx-server-icon--action" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="pvx-server-icon pvx-server-icon--action" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
