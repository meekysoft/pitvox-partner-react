/**
 * Fetch JSON from the PitVox CDN.
 * Returns null for 404/403 (missing objects).
 *
 * @param {string} cdnUrl - CDN base URL
 * @param {string} path - Path relative to CDN root
 * @returns {Promise<any|null>}
 */
export async function fetchCdnJson(cdnUrl, path) {
  const res = await fetch(`${cdnUrl}/${path}`)
  if (!res.ok) {
    if (res.status === 404 || res.status === 403) return null
    throw new Error(`CDN fetch failed: ${res.status}`)
  }
  return res.json()
}

/**
 * Build a game-first leaderboard CDN path, with optional partner scoping.
 * @param {string|null} partnerSlug
 * @param {string} game - Game identifier ('acc', 'evo', 'lmu')
 * @param {string|null} [gameVersion] - Version for versioned games (EVO, LMU)
 * @param  {...string} segments - Path segments after the game/version prefix
 * @returns {string}
 */
export function buildLeaderboardPath(partnerSlug, game, gameVersion, ...segments) {
  const parts = ['leaderboards']
  if (partnerSlug) parts.push(`partners/${partnerSlug}`)
  if (game) parts.push(game)
  if (gameVersion) parts.push(`v/${gameVersion}`)
  return [...parts, ...segments].join('/')
}

/**
 * Build a per-(driver, track, layout) laps CDN path, with optional partner scoping.
 * Each file contains all of the driver's eligible laps for that specific track + layout.
 *
 * @param {string|null} partnerSlug
 * @param {string} userId
 * @param {string} trackId
 * @param {string|null} [layout] - Track layout (null/undefined → 'default')
 * @returns {string}
 */
export function buildLapsPath(partnerSlug, userId, trackId, layout) {
  const layoutKey = layout || 'default'
  return partnerSlug
    ? `laps/partners/${partnerSlug}/${userId}/${trackId}/${layoutKey}.json`
    : `laps/${userId}/${trackId}/${layoutKey}.json`
}

/**
 * Build a driver index CDN path (totals, breakdowns, records, ranking).
 * Companion to {@link buildLapsPath}; the index aggregates a driver's stats
 * across all combos and is small and cheap to fetch.
 *
 * @param {string|null} partnerSlug
 * @param {string} userId
 * @returns {string}
 */
export function buildDriverIndexPath(partnerSlug, userId) {
  return partnerSlug
    ? `laps/partners/${partnerSlug}/${userId}/index.json`
    : `laps/${userId}/index.json`
}

/**
 * Build a recent-laps CDN path, with optional partner scoping.
 * @param {string|null} partnerSlug
 * @returns {string}
 */
export function buildRecentLapsPath(partnerSlug) {
  return partnerSlug
    ? `recent-laps/partners/${partnerSlug}.json`
    : 'recent-laps.json'
}
