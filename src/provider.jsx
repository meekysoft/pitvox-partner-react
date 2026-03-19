import { createContext, useContext, useMemo } from 'react'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'

const PitVoxContext = createContext(null)

const DEFAULT_CDN_URL = 'https://cdn.pitvox.com'
const DEFAULT_PITVOX_URL = 'https://pitvox.com'

// Internal QueryClient for when the consumer hasn't provided one
let internalQueryClient = null

/**
 * Provider for PitVox partner SDK.
 *
 * @param {object} props
 * @param {string} props.partnerSlug - Partner identifier (e.g., 'mrgit')
 * @param {string} [props.cdnUrl] - CDN base URL (default: https://cdn.pitvox.com)
 * @param {string} [props.pitvoxUrl] - PitVox website URL for registration links (default: https://pitvox.com)
 * @param {() => string|null} [props.getSteamId] - Function returning current user's Steam ID
 * @param {(competitionId: string, driverData: object) => Promise<void>} [props.onRegister] - Callback for in-app registration (power mode)
 * @param {(competitionId: string, steamId: string) => Promise<void>} [props.onWithdraw] - Callback for in-app withdrawal (power mode)
 * @param {(params: {limit?: number, offset?: number, unreadOnly?: boolean}) => Promise<{notifications: object[], unreadCount: number}>} [props.onFetchNotifications] - Callback to fetch notifications from partner backend
 * @param {(notificationId: string) => Promise<void>} [props.onMarkNotificationRead] - Callback to mark a notification as read
 * @param {() => Promise<void>} [props.onMarkAllNotificationsRead] - Callback to mark all notifications as read
 * @param {import('react').ReactNode} props.children
 */
export function PitVoxPartnerProvider({
  partnerSlug,
  cdnUrl = DEFAULT_CDN_URL,
  pitvoxUrl = DEFAULT_PITVOX_URL,
  getSteamId,
  onRegister,
  onWithdraw,
  onFetchNotifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  children,
}) {
  const value = useMemo(() => ({
    partnerSlug,
    cdnUrl: cdnUrl.replace(/\/$/, ''),
    pitvoxUrl: pitvoxUrl.replace(/\/$/, ''),
    getSteamId: getSteamId || (() => null),
    onRegister: onRegister || null,
    onWithdraw: onWithdraw || null,
    onFetchNotifications: onFetchNotifications || null,
    onMarkNotificationRead: onMarkNotificationRead || null,
    onMarkAllNotificationsRead: onMarkAllNotificationsRead || null,
  }), [partnerSlug, cdnUrl, pitvoxUrl, getSteamId, onRegister, onWithdraw, onFetchNotifications, onMarkNotificationRead, onMarkAllNotificationsRead])

  // Check if a QueryClient already exists (consumer provided their own)
  let hasExistingClient = false
  try {
    useQueryClient()
    hasExistingClient = true
  } catch {
    hasExistingClient = false
  }

  if (hasExistingClient) {
    return (
      <PitVoxContext.Provider value={value}>
        {children}
      </PitVoxContext.Provider>
    )
  }

  // No existing QueryClient — provide our own
  if (!internalQueryClient) {
    internalQueryClient = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60_000 },
      },
    })
  }

  return (
    <QueryClientProvider client={internalQueryClient}>
      <PitVoxContext.Provider value={value}>
        {children}
      </PitVoxContext.Provider>
    </QueryClientProvider>
  )
}

/**
 * Access the PitVox partner context.
 * @returns {{ partnerSlug: string, cdnUrl: string, pitvoxUrl: string, getSteamId: () => string|null, onRegister: Function|null, onWithdraw: Function|null }}
 */
export function usePitVox() {
  const ctx = useContext(PitVoxContext)
  if (!ctx) {
    throw new Error('usePitVox must be used within a <PitVoxPartnerProvider>')
  }
  return ctx
}
