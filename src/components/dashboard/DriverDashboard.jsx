import { useDriverStats } from '../../hooks/useDriverStats.js'
import { useDriverRating } from '../../hooks/useDriverRating.js'
import { useUpcomingEvents } from '../../hooks/useUpcomingEvents.js'
import { useNotifications, useNotificationsEnabled, useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/useNotifications.js'
import { DriverProfile } from './DriverProfile.jsx'
import { StatsCards } from './StatsCards.jsx'
import { RecordsTable } from './RecordsTable.jsx'
import { UpcomingEvents } from './UpcomingEvents.jsx'
import { NotificationsCard } from './NotificationsCard.jsx'

/**
 * Composite driver dashboard component.
 * Fetches and displays a driver's profile, stats, rating, records,
 * upcoming events, and notifications.
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
  const { data: upcomingEvents, isLoading: eventsLoading } = useUpcomingEvents()
  const notificationsEnabled = useNotificationsEnabled()
  const { data: notifData, isLoading: notifLoading } = useNotifications({ limit: 10 })
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

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

      {steamId && (
        <UpcomingEvents events={upcomingEvents} isLoading={eventsLoading} />
      )}

      <div className={`pvx-dash-row ${notificationsEnabled ? 'pvx-dash-row--2col' : ''}`}>
        <RecordsTable records={stats.currentRecords} />
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
