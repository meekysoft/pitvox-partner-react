import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePitVox } from '../provider.jsx'
import { useUserLookup } from './useLeaderboards.js'

/**
 * Check if the current user (via getSteamId) is registered for a competition.
 * Uses the CDN entry list for a lightweight check.
 *
 * @param {string} competitionId
 */
export function useRegistrationStatus(competitionId) {
  const { cdnUrl, partnerSlug, getSteamId } = usePitVox()
  const steamId = getSteamId()

  return useQuery({
    queryKey: ['pitvox', 'registration', partnerSlug, competitionId, steamId],
    queryFn: async () => {
      const res = await fetch(`${cdnUrl}/competitions/${partnerSlug}/${competitionId}/entrylist.json`)
      if (!res.ok) return { isRegistered: false, entryList: null }
      const data = await res.json()
      const isRegistered = !!steamId && data.drivers?.some((d) => d.steamId === steamId)
      return { isRegistered, entryList: data }
    },
    enabled: !!competitionId,
    staleTime: 60_000,
  })
}

/**
 * Register the current user for a competition.
 * Delegates to the onRegister callback provided to PitVoxPartnerProvider.
 *
 * @param {string} competitionId
 */
export function useRegister(competitionId) {
  const { onRegister, partnerSlug, getSteamId } = usePitVox()
  const queryClient = useQueryClient()
  const getUserDisplay = useUserLookup()

  return useMutation({
    mutationFn: (driverData) => {
      if (!onRegister) {
        throw new Error(
          'No onRegister callback provided to PitVoxPartnerProvider. ' +
          'Provide onRegister for in-app registration, or use useRegistrationUrl() to link to pitvox.com.'
        )
      }
      return onRegister(competitionId, driverData)
    },
    onSuccess: () => {
      const steamId = getSteamId()

      // Optimistically mark user as registered (CDN won't reflect the change immediately)
      queryClient.setQueriesData(
        { queryKey: ['pitvox', 'registration', partnerSlug, competitionId] },
        (old) => old ? { ...old, isRegistered: true } : { isRegistered: true, entryList: null },
      )

      // Optimistically add user to entry list cache
      if (steamId) {
        const userInfo = getUserDisplay(steamId)
        const newEntry = {
          steamId,
          displayName: userInfo.displayName,
          avatarUrl: userInfo.avatarUrl,
        }
        queryClient.setQueriesData(
          { queryKey: ['pitvox', 'competition', partnerSlug, competitionId, 'entrylist'] },
          (old) => {
            if (!old) return { drivers: [newEntry] }
            const exists = old.drivers?.some((d) => d.steamId === steamId)
            if (exists) return old
            return { ...old, drivers: [...(old.drivers || []), newEntry] }
          },
        )
      }
    },
  })
}

/**
 * Unregister the current user from a competition.
 * Delegates to the onWithdraw callback provided to PitVoxPartnerProvider.
 *
 * @param {string} competitionId
 */
export function useWithdraw(competitionId) {
  const { onWithdraw, partnerSlug, getSteamId } = usePitVox()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (steamId) => {
      if (!onWithdraw) {
        throw new Error(
          'No onWithdraw callback provided to PitVoxPartnerProvider. ' +
          'Provide onWithdraw for in-app withdrawal, or use useRegistrationUrl() to link to pitvox.com.'
        )
      }
      const id = steamId || getSteamId()
      if (!id) throw new Error('No Steam ID available')
      return onWithdraw(competitionId, id)
    },
    onSuccess: () => {
      const steamId = getSteamId()

      // Optimistically mark user as unregistered
      queryClient.setQueriesData(
        { queryKey: ['pitvox', 'registration', partnerSlug, competitionId] },
        (old) => old ? { ...old, isRegistered: false } : { isRegistered: false, entryList: null },
      )

      // Optimistically remove user from entry list cache
      if (steamId) {
        queryClient.setQueriesData(
          { queryKey: ['pitvox', 'competition', partnerSlug, competitionId, 'entrylist'] },
          (old) => {
            if (!old?.drivers) return old
            return { ...old, drivers: old.drivers.filter((d) => d.steamId !== steamId) }
          },
        )
      }
    },
  })
}

/**
 * Check whether the SDK is in power mode (callbacks provided) or basic mode (link to pitvox.com).
 *
 * @returns {{ isPowerMode: boolean, isBasicMode: boolean }}
 */
export function useRegistrationMode() {
  const { onRegister, onWithdraw } = usePitVox()
  const isPowerMode = !!(onRegister && onWithdraw)
  return { isPowerMode, isBasicMode: !isPowerMode }
}

/**
 * Get the pitvox.com registration URL for a competition (basic mode).
 *
 * @param {string} competitionId
 * @returns {string}
 */
export function useRegistrationUrl(competitionId) {
  const { pitvoxUrl, partnerSlug } = usePitVox()
  return `${pitvoxUrl}/p/${partnerSlug}/competitions/${competitionId}/register`
}
