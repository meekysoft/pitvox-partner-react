import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { usePitVox } from '../provider.jsx'
import { fetchCdnJson, buildLeaderboardPath } from '../lib/cdn.js'
import { useLeaderboardIndex } from './useLeaderboards.js'

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

/**
 * Per-game rating chips for a single driver. Returns one entry per game
 * (EVO/ACC/LMU) where the driver appears in the partner-scoped ratings file.
 *
 * Versions for EVO and LMU are read from the leaderboard index's `versions`
 * metadata (keyed by `default`), so ratings always track the current default
 * version without a hardcode. ACC is unversioned.
 *
 * Each entry: `{game, label, rating, rank, totalDrivers}`. Order matches
 * the leaderboards page tabs (EVO, ACC, LMU) for predictability.
 *
 * @param {string} steamId - Driver's Steam ID
 * @returns {{ data: Array<object>, isLoading: boolean }}
 */
export function useDriverRatingsByGame(steamId) {
  const { versions } = useLeaderboardIndex()
  const evoVersion = versions?.evo?.default
  const lmuVersion = versions?.lmu?.default

  const evoQuery = useDriverRatings({ game: 'evo', gameVersion: evoVersion, enabled: !!evoVersion })
  const accQuery = useDriverRatings({ game: 'acc' })
  const lmuQuery = useDriverRatings({ game: 'lmu', gameVersion: lmuVersion, enabled: !!lmuVersion })

  const data = useMemo(() => {
    if (!steamId) return []
    return [
      { data: evoQuery.data, game: 'evo', label: 'EVO' },
      { data: accQuery.data, game: 'acc', label: 'ACC' },
      { data: lmuQuery.data, game: 'lmu', label: 'LMU' },
    ]
      .map(({ data: ratingsData, game, label }) => {
        if (!ratingsData?.drivers?.length) return null
        const sorted = [...ratingsData.drivers].sort((a, b) => b.rating - a.rating)
        const idx = sorted.findIndex((d) => d.identifier === steamId)
        if (idx === -1) return null
        return {
          game,
          label,
          rating: sorted[idx].rating,
          rank: idx + 1,
          totalDrivers: sorted.length,
        }
      })
      .filter(Boolean)
  }, [steamId, evoQuery.data, accQuery.data, lmuQuery.data])

  return {
    data,
    isLoading: evoQuery.isLoading || accQuery.isLoading || lmuQuery.isLoading,
  }
}
