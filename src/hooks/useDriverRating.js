import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { usePitVox } from '../provider.jsx'
import { fetchCdnJson } from '../lib/cdn.js'

/**
 * Fetch a driver's rating from the partner ratings CDN file.
 *
 * @param {string} steamId - Driver's Steam ID
 * @returns {{ data: object|null, isLoading: boolean, error: Error|null }}
 */
export function useDriverRating(steamId) {
  const { cdnUrl, partnerSlug } = usePitVox()

  const query = useQuery({
    queryKey: ['pitvox', 'ratings', partnerSlug],
    queryFn: () => fetchCdnJson(cdnUrl, `leaderboards/partners/${partnerSlug}/ratings.json`),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const entry = useMemo(() => {
    if (!query.data?.drivers || !steamId) return null
    return query.data.drivers.find(
      (r) => r.identifier === steamId
    ) || null
  }, [query.data?.drivers, steamId])

  return {
    isLoading: query.isLoading,
    error: query.error,
    data: entry
      ? {
          rating: entry.rating,
          rank: entry.rank,
          totalDrivers: query.data.driverCount || query.data.drivers.length,
          comboCount: entry.comboCount || 0,
          distinctCars: entry.distinctCars || 0,
          combos: entry.combos || [],
        }
      : null,
  }
}
