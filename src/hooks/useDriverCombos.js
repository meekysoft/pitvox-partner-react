import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { usePitVox } from '../provider.jsx'
import { fetchCdnJson, buildDriverIndexPath } from '../lib/cdn.js'

/**
 * Fetch a driver's per-(track, layout, car, game, version) combo list from
 * the per-driver CDN index. Partner-scoped via the provider's `partnerSlug`,
 * so a partner site sees rank/gap relative to its own filtered leaderboard.
 *
 * Each combo: `{trackId, trackLayout, carId, game, gameVersion, lapCount,
 * validLapCount, lastDrivenAt, personalBestMs, rank, totalDrivers,
 * gapToLeaderMs, gapToNextMs}`. Sorted server-side by `lastDrivenAt` desc.
 *
 * Rank/gap fields are populated when the relevant track was in the regen's
 * leaderboard cache. On the partner path that means the 5-min full pass —
 * fast-drain regens don't touch partner indexes, so rank may lag a few
 * minutes after a fresh lap. `lapCount` and `lastDrivenAt` are always fresh.
 *
 * @param {string} steamId - Driver's Steam ID
 * @returns {{ data: Array<object>|null, isLoading: boolean, error: Error|null }}
 */
export function useDriverCombos(steamId) {
  const { cdnUrl, partnerSlug } = usePitVox()

  const query = useQuery({
    queryKey: ['pitvox', 'laps', partnerSlug || 'global', steamId, 'index'],
    queryFn: () => fetchCdnJson(cdnUrl, buildDriverIndexPath(partnerSlug, steamId)),
    enabled: !!steamId,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  const combos = useMemo(() => query.data?.combos || [], [query.data])

  return {
    isLoading: query.isLoading,
    error: query.error,
    data: combos,
  }
}
