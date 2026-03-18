/**
 * PitVox REST API client for partner operations.
 * Authenticates via X-Partner-Key header.
 */

/**
 * Make an authenticated request to pitvox-api.
 *
 * @param {string} apiUrl - API base URL
 * @param {string} apiKey - Partner API key
 * @param {string} path - API path (e.g., '/api/v1/competitions/{id}/register')
 * @param {object} [options] - Fetch options
 * @returns {Promise<any>}
 */
async function apiRequest(apiUrl, apiKey, path, options = {}) {
  const res = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Partner-Key': apiKey,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `API request failed: ${res.status}`)
  }

  return res.json()
}

/**
 * Register a driver for a competition.
 *
 * @param {string} apiUrl
 * @param {string} apiKey
 * @param {string} competitionId
 * @param {object} data - { steam_id, display_name, avatar_url?, discord_username?, experience?, comments? }
 */
export function registerDriver(apiUrl, apiKey, competitionId, data) {
  return apiRequest(apiUrl, apiKey, `/api/v1/competitions/${competitionId}/register`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Unregister a driver from a competition.
 *
 * @param {string} apiUrl
 * @param {string} apiKey
 * @param {string} competitionId
 * @param {string} steamId
 */
export function unregisterDriver(apiUrl, apiKey, competitionId, steamId) {
  return apiRequest(apiUrl, apiKey, `/api/v1/competitions/${competitionId}/register/${steamId}`, {
    method: 'DELETE',
  })
}

/**
 * List registrations for a competition.
 *
 * @param {string} apiUrl
 * @param {string} apiKey
 * @param {string} competitionId
 */
export function listRegistrations(apiUrl, apiKey, competitionId) {
  return apiRequest(apiUrl, apiKey, `/api/v1/competitions/${competitionId}/registrations`)
}
