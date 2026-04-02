import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { usePitVox } from '../provider.jsx'
import { fetchCdnJson, buildLeaderboardPath, buildLapsPath, buildRecentLapsPath } from '../lib/cdn.js'
import { formatCarName, formatTrackName } from '../utils/format.js'

/**
 * Fetch the leaderboard index (all tracks with record holders).
 * In partner mode, returns partner-scoped data. In global mode, returns all data.
 *
 * @param {object} [options]
 * @param {string} [options.game] - Filter by game ('evo' | 'acc')
 * @param {string} [options.gameVersion] - Filter by game version (EVO only)
 */
export function useLeaderboardIndex(options = {}) {
  const { cdnUrl, partnerSlug } = usePitVox()
  const { game, gameVersion } = options

  const path = buildLeaderboardPath(partnerSlug, null, null, 'index.json')

  const query = useQuery({
    queryKey: ['pitvox', 'leaderboards', partnerSlug, 'index'],
    queryFn: () => fetchCdnJson(cdnUrl, path),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  const tracks = useMemo(() => {
    if (!query.data?.tracks) return []

    let filtered = query.data.tracks
    if (game) filtered = filtered.filter((t) => t.game === game)
    if (gameVersion) filtered = filtered.filter((t) => t.gameVersion === gameVersion)

    return filtered.map((track) => ({
      id: track.trackId,
      layout: track.layout,
      game: track.game,
      gameVersion: track.gameVersion,
      displayName: formatTrackName(track.trackId, track.layout, track.game),
      driverCount: track.driverCount || 0,
      carCount: track.carCount || 0,
      record: track.recordHolder
        ? {
            visibleId: track.recordHolder.steamId || track.recordHolder.userId,
            carId: track.recordHolder.carId,
            carDisplayName: formatCarName(track.recordHolder.carId),
            lapTimeMs: track.recordHolder.lapTimeMs,
            timestamp: track.recordHolder.recordedAt,
          }
        : null,
      recordByTag: track.recordByTag || null,
    }))
  }, [query.data?.tracks, game, gameVersion])

  return {
    ...query,
    data: tracks,
    partner: query.data?.partner || null,
    generatedAt: query.data?.generatedAt,
    totalLaps: query.data?.totalLaps || 0,
    totalUsers: query.data?.totalUsers || 0,
    versions: query.data?.versions || {},
  }
}

/**
 * Fetch track leaderboard entries from CDN.
 * Returns all entries for a track — caller filters by carId for Layer 3.
 *
 * @param {string} trackId
 * @param {string} [layout] - Track layout (null/undefined → 'default')
 * @param {object} [options]
 * @param {string} [options.carId] - Filter to specific car (Layer 3 mode)
 * @param {string} [options.game] - Game identifier for CDN path ('acc', 'evo', 'lmu')
 * @param {string} [options.gameVersion] - Version for versioned CDN paths (EVO, LMU)
 */
export function useTrackLeaderboard(trackId, layout, options = {}) {
  const { cdnUrl, partnerSlug } = usePitVox()
  const { carId, game, gameVersion } = options

  const layoutKey = layout || 'default'
  const path = buildLeaderboardPath(partnerSlug, game, gameVersion, `tracks/${trackId}/${layoutKey}.json`)

  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['pitvox', 'leaderboards', partnerSlug, 'track', trackId, layoutKey, game, gameVersion],
    queryFn: () => fetchCdnJson(cdnUrl, path),
    enabled: !!trackId,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  const entries = useMemo(() => {
    if (!rawData?.entries) return []

    let filtered = rawData.entries
    if (game) filtered = filtered.filter((e) => e.game === game)

    if (!carId) {
      // Layer 2: best lap per car with driver counts
      const bestPerCar = new Map()
      const driversPerCar = new Map()

      for (const entry of filtered) {
        const visibleId = entry.steamId || entry.userId
        if (!driversPerCar.has(entry.carId)) driversPerCar.set(entry.carId, new Set())
        driversPerCar.get(entry.carId).add(visibleId)

        if (!bestPerCar.has(entry.carId) || entry.lapTimeMs < bestPerCar.get(entry.carId).lapTimeMs) {
          bestPerCar.set(entry.carId, entry)
        }
      }

      return Array.from(bestPerCar.values())
        .map((entry) => ({ ...entry, driverCount: driversPerCar.get(entry.carId)?.size || 0 }))
        .sort((a, b) => a.lapTimeMs - b.lapTimeMs)
    }

    // Layer 3: all drivers for a specific car
    return filtered
      .filter((entry) => entry.carId === carId)
      .sort((a, b) => a.lapTimeMs - b.lapTimeMs)
  }, [rawData?.entries, carId, game])

  return { data: entries, isLoading, error }
}

/**
 * Fetch a driver's full lap history from CDN, filtered to a specific track/car.
 *
 * @param {string} userId - Driver's steamId or userId
 * @param {string} trackId
 * @param {string} [layout]
 * @param {string} carId
 * @param {object} [options]
 * @param {boolean} [options.showInvalid] - Include invalid laps (default false)
 * @param {string} [options.game]
 * @param {string} [options.gameVersion]
 */
export function useDriverLaps(userId, trackId, layout, carId, options = {}) {
  const { cdnUrl, partnerSlug } = usePitVox()
  const { showInvalid = false, game, gameVersion } = options

  const path = buildLapsPath(partnerSlug, userId)

  const query = useQuery({
    queryKey: ['pitvox', 'laps', partnerSlug, userId],
    queryFn: () => fetchCdnJson(cdnUrl, path),
    enabled: !!userId,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  const filteredLaps = useMemo(() => {
    if (!query.data?.laps) return []

    return query.data.laps
      .filter((lap) => {
        if (lap.trackId !== trackId) return false
        if (layout) {
          if (lap.trackLayout !== layout) return false
        } else {
          if (lap.trackLayout && lap.trackLayout !== 'default') return false
        }
        if (lap.carId !== carId) return false
        if (game && lap.game !== game) return false
        if (gameVersion && lap.gameVersion !== gameVersion) return false
        if (!showInvalid && !lap.isValid) return false
        return true
      })
      .sort((a, b) => a.lapTimeMs - b.lapTimeMs)
  }, [query.data?.laps, trackId, layout, carId, game, gameVersion, showInvalid])

  // Theoretical best lap = sum of best individual sectors across all valid laps
  const theoreticalBest = useMemo(() => {
    const validLaps = filteredLaps.filter((l) => l.isValid && l.sector1Ms && l.sector2Ms && l.sector3Ms)
    if (validLaps.length < 2) return null

    const bestS1 = Math.min(...validLaps.map((l) => l.sector1Ms))
    const bestS2 = Math.min(...validLaps.map((l) => l.sector2Ms))
    const bestS3 = Math.min(...validLaps.map((l) => l.sector3Ms))
    const total = bestS1 + bestS2 + bestS3

    const bestLapTime = Math.min(...validLaps.map((l) => l.lapTimeMs))
    // Only meaningful if faster than the actual best lap
    if (total >= bestLapTime) return null

    return { lapTimeMs: total, sector1Ms: bestS1, sector2Ms: bestS2, sector3Ms: bestS3 }
  }, [filteredLaps])

  return {
    ...query,
    data: filteredLaps,
    driverName: query.data?.driverName || 'Driver',
    theoreticalBest,
  }
}

/**
 * Hook for user display name / avatar lookups from CDN users index.
 * Returns a lookup function: (userId, fallback?) => { displayName, avatarUrl, affiliations }
 */
export function useUserLookup() {
  const { cdnUrl } = usePitVox()

  const { data } = useQuery({
    queryKey: ['pitvox', 'users', 'index'],
    queryFn: () => fetchCdnJson(cdnUrl, 'users/index.json'),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })

  const users = data?.users || {}

  return (userId, fallbackName) => {
    const user = users[userId]
    return {
      displayName: user?.displayName || fallbackName || userId || 'Unknown',
      avatarUrl: user?.avatarUrl || null,
      affiliations: user?.affiliations || [],
    }
  }
}

/**
 * Hook for car metadata (tags) from CDN.
 * Used for tag-based filtering in leaderboard tables.
 */
export function useCarMetadata() {
  const { cdnUrl } = usePitVox()

  const { data } = useQuery({
    queryKey: ['pitvox', 'cars', 'evo'],
    queryFn: () => fetchCdnJson(cdnUrl, 'cars/evo.json'),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })

  return {
    tags: data?.tags || [],
    cars: data?.cars || {},
  }
}

/**
 * Fetch recent lap activity from CDN.
 * In partner mode, returns partner-scoped activity. In global mode, returns all activity.
 *
 * @returns {{ groups: object[], generatedAt: string|null, isLoading: boolean }}
 */
export function useRecentLaps() {
  const { cdnUrl, partnerSlug } = usePitVox()

  const path = buildRecentLapsPath(partnerSlug)

  const query = useQuery({
    queryKey: ['pitvox', 'recentLaps', partnerSlug],
    queryFn: () => fetchCdnJson(cdnUrl, path),
    staleTime: 30_000,
    refetchInterval: 30_000,
    gcTime: 10 * 60_000,
  })

  return {
    groups: query.data?.groups || [],
    generatedAt: query.data?.generatedAt || null,
    isLoading: query.isLoading,
  }
}

/**
 * Fetch the full lap leaderboard for a specific track/car combination.
 * @deprecated Use useTrackLeaderboard(trackId, layout, { carId }) instead
 *
 * @param {string} trackId
 * @param {string} carId
 */
export function useCarLeaderboard(trackId, carId) {
  return useTrackLeaderboard(trackId, null, { carId })
}
