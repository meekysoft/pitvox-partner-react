import { useState, useRef, useEffect } from 'react'
import { formatCarName, formatTrackName } from '../../utils/format.js'

/* ─── SVG icons (inline to avoid external deps) ─── */

function HashIcon() {
  return (
    <svg className="pvx-dash-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  )
}

function SteeringWheelIcon() {
  return (
    <svg className="pvx-dash-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 14v4" />
      <path d="M10.5 12.5l-4 2.5" />
      <path d="M13.5 12.5l4 2.5" />
    </svg>
  )
}

function RatingIcon() {
  return (
    <svg className="pvx-dash-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function StatCardWithBreakdown({ icon, value, label, items, labelKey, countKey }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const sorted = items?.length
    ? items.slice().sort((a, b) => b[countKey] - a[countKey])
    : null

  return (
    <div
      ref={ref}
      className={`pvx-dash-stat-card ${sorted ? 'pvx-dash-stat-card--clickable' : ''}`}
      onClick={sorted ? () => setOpen((v) => !v) : undefined}
    >
      {icon}
      <div className="pvx-dash-stat-content">
        <span className="pvx-dash-stat-value">{value}</span>
        <span className="pvx-dash-stat-label">{label}</span>
      </div>
      {sorted && (
        <div className={`pvx-dash-tooltip pvx-dash-tooltip--scrollable ${open ? 'pvx-dash-tooltip--open' : ''}`}>
          {sorted.map((item, i) => (
            <div key={i} className="pvx-dash-tooltip-row">
              <span className="pvx-dash-tooltip-label">{item[labelKey]}</span>
              <span className="pvx-dash-tooltip-value">{item[countKey]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Stats cards row — Total Laps, Cars Used, Driver Rating(s).
 *
 * The Laps and Cars cards open a breakdown popover on click. The Driver
 * Rating card supports two modes:
 *
 * - **`gameRatings`** (preferred) — array of `{game, label, rating, rank,
 *   totalDrivers}`. Renders one chip per game. Suits multi-sim drivers and
 *   single-sim drivers equally well — chip count is whatever the user has.
 *   Pass an `onGameRatingSelect(entry)` callback to make chips clickable.
 *
 * - **`rating`** (legacy) — single object. Renders a single big number,
 *   matching the original API. Kept for backward compatibility with
 *   consumers that haven't migrated.
 *
 * If both are provided, `gameRatings` wins.
 *
 * @param {object} props
 * @param {object} props.stats - From useDriverStats().data
 * @param {Array}  [props.gameRatings] - From useDriverRatingsByGame().data
 * @param {(entry: object) => void} [props.onGameRatingSelect] - Chip click handler
 * @param {object} [props.rating] - Legacy single rating from useDriverRating().data
 * @param {string} [props.className]
 */
export function StatsCards({ stats, gameRatings, onGameRatingSelect, rating, className = '' }) {
  if (!stats) return null

  const trackItems = stats.trackBreakdown.map((t) => ({
    name: formatTrackName(t.trackId, t.layout),
    lapCount: t.lapCount,
  }))

  const carItems = stats.carBreakdown.map((c) => ({
    name: formatCarName(c.carId),
    lapCount: c.lapCount,
  }))

  const hasChips = Array.isArray(gameRatings) && gameRatings.length > 0

  return (
    <div className={`pvx-dash-stats ${className}`}>
      <StatCardWithBreakdown
        icon={<HashIcon />}
        value={stats.lapCount.toLocaleString()}
        label="Total Laps"
        items={trackItems}
        labelKey="name"
        countKey="lapCount"
      />

      <StatCardWithBreakdown
        icon={<SteeringWheelIcon />}
        value={stats.carBreakdown.length}
        label="Cars Used"
        items={carItems}
        labelKey="name"
        countKey="lapCount"
      />

      {hasChips ? (
        <div className="pvx-dash-stat-card pvx-dash-stat-card--rating-chips">
          <RatingIcon />
          <div className="pvx-dash-stat-content">
            <span className="pvx-dash-stat-label">Driver Rating</span>
            <div className="pvx-dash-rating-chips">
              {gameRatings.map((r) => {
                const clickable = !!onGameRatingSelect
                const handleKeyDown = (e) => {
                  if (!clickable) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onGameRatingSelect(r)
                  }
                }
                return (
                  <span
                    key={r.game}
                    className={`pvx-dash-rating-chip${clickable ? ' pvx-dash-rating-chip--clickable' : ''}`}
                    onClick={clickable ? () => onGameRatingSelect(r) : undefined}
                    onKeyDown={clickable ? handleKeyDown : undefined}
                    role={clickable ? 'button' : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    title={`${r.label} rating: ${r.rating.toFixed(1)} (#${r.rank} of ${r.totalDrivers})`}
                  >
                    <span className="pvx-dash-rating-chip-label">{r.label}</span>
                    <span className="pvx-dash-rating-chip-value">{r.rating.toFixed(1)}</span>
                    <span className="pvx-dash-rating-chip-rank">#{r.rank}/{r.totalDrivers}</span>
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      ) : rating ? (
        <div className="pvx-dash-stat-card pvx-dash-stat-card--rating">
          <RatingIcon />
          <div className="pvx-dash-stat-content">
            <span className="pvx-dash-stat-value">{rating.rating.toFixed(1)}</span>
            <span className="pvx-dash-stat-label">Driver Rating</span>
            <span className="pvx-dash-stat-sub">#{rating.rank} of {rating.totalDrivers}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
