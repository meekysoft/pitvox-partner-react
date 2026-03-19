import { formatRelativeTime, formatNotificationMessage } from '../../utils/format.js'
import { useUserLookup } from '../../hooks/useLeaderboards.js'

/**
 * Notifications card — shows recent notifications with read/unread state.
 *
 * @param {object} props
 * @param {object[]} props.notifications - Notification objects from useNotifications()
 * @param {number} [props.unreadCount=0]
 * @param {(id: string) => void} [props.onMarkRead] - Called when a notification is clicked
 * @param {() => void} [props.onMarkAllRead] - Called when "Mark all read" is clicked
 * @param {boolean} [props.isLoading]
 * @param {string} [props.className]
 */
export function NotificationsCard({ notifications, unreadCount = 0, onMarkRead, onMarkAllRead, isLoading, className }) {
  const getUserDisplay = useUserLookup()

  if (isLoading) {
    return <div className="pvx-loading">Loading notifications...</div>
  }

  return (
    <div className={`pvx-card ${className || ''}`}>
      <div className="pvx-card-header">
        <h3 className="pvx-card-title">
          <BellIcon />
          Notifications
          {unreadCount > 0 && (
            <span className="pvx-notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </h3>
        {unreadCount > 0 && onMarkAllRead && (
          <button className="pvx-notif-mark-all" onClick={onMarkAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {!notifications?.length ? (
        <div className="pvx-notif-empty">No notifications</div>
      ) : (
        <div className="pvx-notif-list">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              getUserDisplay={getUserDisplay}
              onMarkRead={onMarkRead}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationItem({ notification, getUserDisplay, onMarkRead }) {
  const handleClick = () => {
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id)
    }
  }

  return (
    <button
      className={`pvx-notif-item ${notification.isRead ? '' : 'pvx-notif-item--unread'}`}
      onClick={handleClick}
    >
      <NotificationIcon type={notification.type} />
      <div className="pvx-notif-content">
        <span className="pvx-notif-message">
          {formatNotificationMessage(notification, getUserDisplay)}
        </span>
        <span className="pvx-notif-time">
          {formatRelativeTime(notification.createdAt)}
        </span>
      </div>
      {!notification.isRead && <span className="pvx-notif-dot" />}
    </button>
  )
}

function NotificationIcon({ type }) {
  if (type === 'RECORD_BEATEN') {
    return (
      <span className="pvx-notif-icon pvx-notif-icon--beaten">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m7 7 10 10M17 7v10H7" />
        </svg>
      </span>
    )
  }

  if (type === 'ADMIN_MESSAGE') {
    return (
      <span className="pvx-notif-icon pvx-notif-icon--admin">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 11 18-5v12L3 13v-2z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
      </span>
    )
  }

  // Default: RECORD_SET — trophy
  return (
    <span className="pvx-notif-icon pvx-notif-icon--record">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    </span>
  )
}

function BellIcon() {
  return (
    <svg className="pvx-dash-records-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}
