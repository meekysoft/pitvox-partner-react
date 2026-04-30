import { useDriverStats } from '../../hooks/useDriverStats.js'
import { useDriverCombos } from '../../hooks/useDriverCombos.js'
import { useDriverRatingsByGame } from '../../hooks/useDriverRating.js'
import { useUpcomingEvents } from '../../hooks/useUpcomingEvents.js'
import { useNotifications, useNotificationsEnabled, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/useNotifications.js'
import { DriverProfile } from './DriverProfile.jsx'
import { StatsCards } from './StatsCards.jsx'
import { RecentCombosCard } from './RecentCombosCard.jsx'
import { UpcomingEvents } from './UpcomingEvents.jsx'
import { NotificationsCard } from './NotificationsCard.jsx'

/**
 * Composite driver dashboard component.
 *
 * Fetches and displays the driver's profile, stats, per-game rating chips,
 * recent combos (with rank/gap and quick-nav into the partner's leaderboard),
 * upcoming events, and notifications.
 *
 * The Records table has been replaced by the trophy iconography on the
 * Recent Combos card — each combo where the driver is `rank=1` (and there's
 * more than one driver on the leaderboard) flags as a held record.
 *
 * @param {object} props
 * @param {string} props.steamId - Driver's Steam ID
 * @param {string} [props.avatarUrl] - Avatar URL (from auth provider)
 * @param {string} [props.memberSince] - ISO date for "Racing since"
 * @param {boolean} [props.hideProfile=false] - Skip the avatar/name profile
 *   card. Useful when the host site already shows the user's identity
 *   prominently (e.g. in a navbar) and an extra header is redundant.
 * @param {(combo: object) => void} [props.onComboSelect] - Combo row click handler
 * @param {(entry: object) => void} [props.onGameRatingSelect] - Rating chip click handler
 * @param {string} [props.className]
 */
export function DriverDashboard({
  steamId,
  avatarUrl,
  memberSince,
  hideProfile = false,
  onComboSelect,
  onGameRatingSelect,
  className = '',
}) {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDriverStats(steamId)
  const { data: gameRatings } = useDriverRatingsByGame(steamId)
  const { data: combos } = useDriverCombos(steamId)
  const { data: upcomingEvents, isLoading: eventsLoading } = useUpcomingEvents()
  const notificationsEnabled = useNotificationsEnabled()
  const { data: notifData, isLoading: notifLoading } = useNotifications({ limit: 10 })
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  if (statsLoading) {
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
      {!hideProfile && (
        <DriverProfile
          driverName={stats.driverName}
          avatarUrl={avatarUrl}
          memberSince={memberSince}
        />
      )}
      <StatsCards
        stats={stats}
        gameRatings={gameRatings}
        onGameRatingSelect={onGameRatingSelect}
      />

      {steamId && (
        <UpcomingEvents events={upcomingEvents} isLoading={eventsLoading} />
      )}

      <div className={`pvx-dash-row ${notificationsEnabled ? 'pvx-dash-row--2col' : ''}`}>
        <RecentCombosCard combos={combos} onComboSelect={onComboSelect} />
        {notificationsEnabled && (
          <NotificationsCard
            notifications={notifData?.notifications}
            unreadCount={notifData?.unreadCount || 0}
            onMarkRead={(id) => markRead.mutate(id)}
            onMarkAllRead={() => markAllRead.mutate()}
            isLoading={notifLoading}
          />
        )}
      </div>
    </div>
  )
}
