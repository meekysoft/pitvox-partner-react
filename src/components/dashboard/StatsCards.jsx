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

function BreakdownTooltip({ items, labelKey, countKey }) {
  if (!items?.length) return null
  const top = items
    .slice()
    .sort((a, b) => b[countKey] - a[countKey])
    .slice(0, 10)

  return (
    <div className="pvx-dash-tooltip">
      {top.map((item, i) => (
        <div key={i} className="pvx-dash-tooltip-row">
          <span className="pvx-dash-tooltip-label">{item[labelKey]}</span>
          <span className="pvx-dash-tooltip-value">{item[countKey]}</span>
        </div>
      ))}
      {items.length > 10 && (
        <div className="pvx-dash-tooltip-row pvx-dash-tooltip-more">
          +{items.length - 10} more
        </div>
      )}
    </div>
  )
}

/**
 * Stats cards row — Total Laps, Cars Used, Driver Rating.
 * Laps and Cars cards show a breakdown tooltip on hover.
 *
 * @param {object} props
 * @param {object} props.stats - From useDriverStats().data
 * @param {object} [props.rating] - From useDriverRating().data
 * @param {string} [props.className]
 */
export function StatsCards({ stats, rating, className = '' }) {
  if (!stats) return null

  const trackItems = stats.trackBreakdown.map((t) => ({
    name: formatTrackName(t.trackId, t.layout),
    lapCount: t.lapCount,
  }))

  const carItems = stats.carBreakdown.map((c) => ({
    name: formatCarName(c.carId),
    lapCount: c.lapCount,
  }))

  return (
    <div className={`pvx-dash-stats ${className}`}>
      <div className="pvx-dash-stat-card pvx-dash-stat-card--has-tooltip">
        <HashIcon />
        <div className="pvx-dash-stat-content">
          <span className="pvx-dash-stat-value">{stats.lapCount.toLocaleString()}</span>
          <span className="pvx-dash-stat-label">Total Laps</span>
        </div>
        <BreakdownTooltip items={trackItems} labelKey="name" countKey="lapCount" />
      </div>

      <div className="pvx-dash-stat-card pvx-dash-stat-card--has-tooltip">
        <SteeringWheelIcon />
        <div className="pvx-dash-stat-content">
          <span className="pvx-dash-stat-value">{stats.carBreakdown.length}</span>
          <span className="pvx-dash-stat-label">Cars Used</span>
        </div>
        <BreakdownTooltip items={carItems} labelKey="name" countKey="lapCount" />
      </div>

      {rating && (
        <div className="pvx-dash-stat-card pvx-dash-stat-card--rating">
          <RatingIcon />
          <div className="pvx-dash-stat-content">
            <span className="pvx-dash-stat-value">{rating.rating.toFixed(1)}</span>
            <span className="pvx-dash-stat-label">Driver Rating</span>
            <span className="pvx-dash-stat-sub">#{rating.rank} of {rating.totalDrivers}</span>
          </div>
        </div>
      )}
    </div>
  )
}
