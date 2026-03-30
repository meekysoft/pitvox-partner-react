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
 * Build a leaderboard CDN path, with optional partner scoping.
 * @param {string|null} partnerSlug
 * @param  {...string} segments - Path segments after the leaderboard prefix
 * @returns {string}
 */
export function buildLeaderboardPath(partnerSlug, ...segments) {
  const prefix = partnerSlug ? `leaderboards/partners/${partnerSlug}` : 'leaderboards'
  return [prefix, ...segments].join('/')
}

/**
 * Build a laps CDN path, with optional partner scoping.
 * @param {string|null} partnerSlug
 * @param {string} userId
 * @returns {string}
 */
export function buildLapsPath(partnerSlug, userId) {
  return partnerSlug
    ? `laps/partners/${partnerSlug}/${userId}.json`
    : `laps/${userId}.json`
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
