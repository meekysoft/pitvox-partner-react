import { useDriverStats } from '../../hooks/useDriverStats.js'
import { useDriverRating } from '../../hooks/useDriverRating.js'
import { DriverProfile } from './DriverProfile.jsx'
import { StatsCards } from './StatsCards.jsx'
import { RecordsTable } from './RecordsTable.jsx'

/**
 * Composite driver dashboard component.
 * Fetches and displays a driver's profile, stats, rating, and records.
 *
 * @param {object} props
 * @param {string} props.steamId - Driver's Steam ID
 * @param {string} [props.avatarUrl] - Avatar URL (from auth provider)
 * @param {string} [props.memberSince] - ISO date for "Racing since"
 * @param {string} [props.className]
 */
export function DriverDashboard({ steamId, avatarUrl, memberSince, className = '' }) {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDriverStats(steamId)
  const { data: rating, isLoading: ratingLoading } = useDriverRating(steamId)

  if (statsLoading || ratingLoading) {
    return <div className="pvx-loading">Loading dashboard...</div>
  }

  if (statsError) {
    return <div className="pvx-empty">Failed to load dashboard data.</div>
  }

  if (!stats) {
    return <div className="pvx-empty">No data available yet. Start driving to see your stats!</div>
  }

  return (
    <div className={`pvx-dash ${className}`}>
      <DriverProfile
        driverName={stats.driverName}
        avatarUrl={avatarUrl}
        memberSince={memberSince}
      />
      <StatsCards stats={stats} rating={rating} />
      <RecordsTable records={stats.currentRecords} />
    </div>
  )
}
