import { useQuery } from '@tanstack/react-query'
import { usePitVox } from '../provider.jsx'
import { fetchCdnJson, buildDriverIndexPath } from '../lib/cdn.js'

/**
 * Fetch a driver's global stats, records, and ranking from CDN.
 * Uses the global (non-partner-scoped) driver index file so stats reflect
 * all of the driver's activity, not just partner-affiliated laps.
 *
 * @param {string} steamId - Driver's Steam ID
 * @returns {{ data: object|null, isLoading: boolean, error: Error|null }}
 */
export function useDriverStats(steamId) {
  const { cdnUrl } = usePitVox()

  const query = useQuery({
    queryKey: ['pitvox', 'laps', 'global', steamId, 'index'],
    queryFn: () => fetchCdnJson(cdnUrl, buildDriverIndexPath(null, steamId)),
    enabled: !!steamId,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  const raw = query.data

  return {
    isLoading: query.isLoading,
    error: query.error,
    data: raw
      ? {
          driverName: raw.driverName || 'Driver',
          lapCount: raw.lapCount || 0,
          trackBreakdown: raw.trackBreakdown || [],
          carBreakdown: raw.carBreakdown || [],
          recordsHeld: raw.recordsHeld || 0,
          currentRecords: raw.currentRecords || [],
          bestRanking: raw.bestRanking ?? null,
          bestRankingTrackId: raw.bestRankingTrackId ?? null,
          bestRankingLayout: raw.bestRankingLayout ?? null,
          bestRankingCarId: raw.bestRankingCarId ?? null,
          generatedAt: raw.generatedAt,
        }
      : null,
  }
}
