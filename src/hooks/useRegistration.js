import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePitVox } from '../provider.jsx'
import { registerDriver, unregisterDriver } from '../lib/api.js'

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
 * Calls pitvox-api with the partner API key.
 *
 * @param {string} competitionId
 */
export function useRegister(competitionId) {
  const { apiUrl, apiKey, partnerSlug } = usePitVox()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => registerDriver(apiUrl, apiKey, competitionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['pitvox', 'registration', partnerSlug, competitionId],
      })
      queryClient.invalidateQueries({
        queryKey: ['pitvox', 'competition', partnerSlug, competitionId, 'entrylist'],
      })
    },
  })
}

/**
 * Unregister the current user from a competition.
 * Calls pitvox-api with the partner API key.
 *
 * @param {string} competitionId
 */
export function useWithdraw(competitionId) {
  const { apiUrl, apiKey, partnerSlug, getSteamId } = usePitVox()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (steamId) => {
      const id = steamId || getSteamId()
      if (!id) throw new Error('No Steam ID available')
      return unregisterDriver(apiUrl, apiKey, competitionId, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['pitvox', 'registration', partnerSlug, competitionId],
      })
      queryClient.invalidateQueries({
        queryKey: ['pitvox', 'competition', partnerSlug, competitionId, 'entrylist'],
      })
    },
  })
}
