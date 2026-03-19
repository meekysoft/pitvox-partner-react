import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePitVox } from '../provider.jsx'

/**
 * Check whether notifications are enabled (onFetchNotifications callback provided).
 *
 * @returns {boolean}
 */
export function useNotificationsEnabled() {
  const { onFetchNotifications } = usePitVox()
  return !!onFetchNotifications
}

/**
 * Fetch notifications for the current user.
 * Delegates to the onFetchNotifications callback provided to PitVoxPartnerProvider.
 * Disabled when no callback is provided.
 *
 * @param {object} [options]
 * @param {number} [options.limit=20]
 * @param {boolean} [options.unreadOnly=false]
 * @returns {{ data: { notifications: object[], unreadCount: number } | null, isLoading: boolean }}
 */
export function useNotifications(options = {}) {
  const { onFetchNotifications, partnerSlug } = usePitVox()
  const { limit = 20, unreadOnly = false } = options

  return useQuery({
    queryKey: ['pitvox', 'notifications', partnerSlug, { limit, unreadOnly }],
    queryFn: () => onFetchNotifications({ limit, unreadOnly }),
    enabled: !!onFetchNotifications,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

/**
 * Get the unread notification count.
 * Derives from the notifications query cache.
 *
 * @returns {{ count: number, isLoading: boolean }}
 */
export function useUnreadCount() {
  const { onFetchNotifications, partnerSlug } = usePitVox()

  const { data, isLoading } = useQuery({
    queryKey: ['pitvox', 'notifications', partnerSlug, { limit: 1, unreadOnly: false }],
    queryFn: () => onFetchNotifications({ limit: 1 }),
    enabled: !!onFetchNotifications,
    staleTime: 30_000,
    refetchInterval: 30_000,
    select: (d) => d?.unreadCount ?? 0,
  })

  return { count: data ?? 0, isLoading }
}

/**
 * Mark a single notification as read.
 * Delegates to the onMarkNotificationRead callback.
 */
export function useMarkNotificationRead() {
  const { onMarkNotificationRead, partnerSlug } = usePitVox()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId) => {
      if (!onMarkNotificationRead) {
        throw new Error('No onMarkNotificationRead callback provided to PitVoxPartnerProvider.')
      }
      return onMarkNotificationRead(notificationId)
    },
    onSuccess: (_result, notificationId) => {
      // Optimistically mark as read in all notification query caches
      queryClient.setQueriesData(
        { queryKey: ['pitvox', 'notifications', partnerSlug] },
        (old) => {
          if (!old?.notifications) return old
          return {
            ...old,
            unreadCount: Math.max(0, (old.unreadCount || 0) - 1),
            notifications: old.notifications.map((n) =>
              n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
            ),
          }
        },
      )
    },
  })
}

/**
 * Mark all notifications as read.
 * Delegates to the onMarkAllNotificationsRead callback.
 */
export function useMarkAllNotificationsRead() {
  const { onMarkAllNotificationsRead, partnerSlug } = usePitVox()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => {
      if (!onMarkAllNotificationsRead) {
        throw new Error('No onMarkAllNotificationsRead callback provided to PitVoxPartnerProvider.')
      }
      return onMarkAllNotificationsRead()
    },
    onSuccess: () => {
      queryClient.setQueriesData(
        { queryKey: ['pitvox', 'notifications', partnerSlug] },
        (old) => {
          if (!old?.notifications) return old
          return {
            ...old,
            unreadCount: 0,
            notifications: old.notifications.map((n) => ({
              ...n,
              isRead: true,
              readAt: n.readAt || new Date().toISOString(),
            })),
          }
        },
      )
    },
  })
}
