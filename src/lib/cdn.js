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
