/**
 * Format milliseconds as a lap time string (M:SS.mmm).
 *
 * @param {number} ms - Lap time in milliseconds
 * @returns {string} e.g. "1:42.365"
 */
export function formatLapTime(ms) {
  if (!ms && ms !== 0) return '-'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const millis = ms % 1000
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

/**
 * Format milliseconds as a sector time.
 * Under 60s: "SS.mmm" (e.g. "34.567")
 * 60s and over: "M:SS.mmm" (e.g. "3:17.487")
 *
 * @param {number} ms - Sector time in milliseconds
 * @returns {string}
 */
export function formatSectorTime(ms) {
  if (!ms && ms !== 0) return '-'
  if (ms >= 60_000) return formatLapTime(ms)
  return (ms / 1000).toFixed(3)
}

/**
 * Format a car ID to a human-readable display name.
 * Strips the "ks_" prefix (Kunos) and title-cases underscore-separated words.
 *
 * @param {string} carId
 * @returns {string} e.g. "Lancia Delta Hf Integrale Evo Ii"
 */
export function formatCarName(carId) {
  if (!carId) return ''
  let name = carId
  if (name.startsWith('ks_')) name = name.slice(3)
  return name
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Format a track ID + layout to a human-readable display name.
 *
 * @param {string} trackId
 * @param {string} [layout]
 * @param {string} [game] - 'evo' or 'acc' (ACC skips layout display)
 * @returns {string} e.g. "Donington Park National"
 */
export function formatTrackName(trackId, layout, game) {
  if (!trackId) return ''
  const trackName = trackId
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const isAcc = game === 'acc' || (!game && layout?.toLowerCase() === 'track config')
  if (!layout || layout === 'default' || isAcc) return trackName

  const layoutName = layout
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return `${trackName} ${layoutName}`
}

/**
 * Format an ISO timestamp as a short date string.
 *
 * @param {string} timestamp - ISO 8601 date string
 * @returns {string} e.g. "27 Feb 2024"
 */
export function formatDate(timestamp) {
  if (!timestamp) return '-'
  try {
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

/**
 * Format an ISO date string as a relative time (e.g. "2h ago").
 *
 * @param {string} isoDate - ISO 8601 date string
 * @returns {string}
 */
export function formatRelativeTime(isoDate) {
  if (!isoDate) return ''
  const diffMs = Date.now() - new Date(isoDate).getTime()

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return 'Just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  return formatDate(isoDate)
}

/**
 * Format a gap/delta to a reference time.
 *
 * @param {number} deltaMs - Delta in milliseconds (positive = slower)
 * @returns {string} e.g. "+0.542" or "-1.203"
 */
export function formatDelta(deltaMs) {
  if (deltaMs == null) return ''
  const sign = deltaMs >= 0 ? '+' : '-'
  return `${sign}${(Math.abs(deltaMs) / 1000).toFixed(3)}`
}

/**
 * Format tyre compound code to display name.
 *
 * @param {string} code
 * @returns {string}
 */
/**
 * Format a notification object into a display message.
 *
 * @param {object} notification - Notification from pitvox-api
 * @param {(userId: string) => {displayName: string}} [getUserDisplay] - User lookup function
 * @returns {string}
 */
export function formatNotificationMessage(notification, getUserDisplay) {
  const { type, title, trackId, trackLayout, carId, game, data: rawData } = notification
  const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData

  const track = trackId ? formatTrackName(trackId, trackLayout, game) : null
  const car = carId ? formatCarName(carId) : null
  const combo = [track, car].filter(Boolean).join(' — ')

  if (type === 'RECORD_BEATEN' && combo) {
    const beater = data?.beatenBySteamId && getUserDisplay
      ? getUserDisplay(data.beatenBySteamId).displayName
      : 'Someone'
    return `${beater} beat your record on ${combo}`
  }

  if (type === 'RECORD_SET' && combo) {
    return `You set a new record on ${combo}`
  }

  return title || 'New notification'
}

export function formatTyreCompound(code) {
  if (!code) return 'Unknown'
  const compounds = {
    E: 'Eco', RD: 'Road', SC: 'SuperCar', RV: 'Race Vintage',
    SM: 'Semislick', ST: 'Street', HR: 'Hard Race', MR: 'Medium Race',
    SR: 'Soft Race', S: 'Soft',
  }
  return compounds[code] || code
}
