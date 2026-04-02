import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { usePitVox } from '../provider.jsx'
import { fetchCdnJson, buildLeaderboardPath } from '../lib/cdn.js'

/**
 * Shared query for ratings data.
 * Both useDriverRating (single driver) and useDriverRatings (all drivers)
 * share the same cache entry.
 */
function useRatingsQuery(options = {}) {
  const { cdnUrl, partnerSlug } = usePitVox()
  const { game, gameVersion, enabled = true } = options

  const path = buildLeaderboardPath(partnerSlug, game, gameVersion, 'ratings.json')

  return useQuery({
    queryKey: ['pitvox', 'ratings', partnerSlug, game || null, gameVersion || null],
    queryFn: () => fetchCdnJson(cdnUrl, path),
    staleTime: 30_000,
    refetchInterval: 30_000,
    enabled,
  })
}

/**
 * Fetch a single driver's rating from the ratings CDN file.
 *
 * @param {string} steamId - Driver's Steam ID
 * @returns {{ data: object|null, isLoading: boolean, error: Error|null }}
 */
export function useDriverRating(steamId) {
  const query = useRatingsQuery()

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

/**
 * Fetch all driver ratings for the rankings table.
 *
 * @param {object} [options]
 * @param {string} [options.game] - Game identifier ('acc', 'evo', 'lmu')
 * @param {string} [options.gameVersion] - Version for versioned games (EVO, LMU)
 * @param {boolean} [options.enabled] - Whether to enable the query (default true)
 * @returns {{ data: object|null, isLoading: boolean, error: Error|null }}
 */
export function useDriverRatings(options = {}) {
  const query = useRatingsQuery(options)

  return {
    data: query.data || null,
    isLoading: query.isLoading,
    error: query.error,
  }
}
