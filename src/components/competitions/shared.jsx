/**
 * Shared UI primitives for competition components.
 */

// ─── Nation flags ─────────────────────────────────────────────────────────

export const NATION_FLAGS = {
  GBR: '\u{1F1EC}\u{1F1E7}', DEU: '\u{1F1E9}\u{1F1EA}', NLD: '\u{1F1F3}\u{1F1F1}',
  SWE: '\u{1F1F8}\u{1F1EA}', ESP: '\u{1F1EA}\u{1F1F8}', ZAF: '\u{1F1FF}\u{1F1E6}',
  FRA: '\u{1F1EB}\u{1F1F7}', ITA: '\u{1F1EE}\u{1F1F9}', USA: '\u{1F1FA}\u{1F1F8}',
  AUS: '\u{1F1E6}\u{1F1FA}', BRA: '\u{1F1E7}\u{1F1F7}', JPN: '\u{1F1EF}\u{1F1F5}',
  CAN: '\u{1F1E8}\u{1F1E6}', POL: '\u{1F1F5}\u{1F1F1}', AUT: '\u{1F1E6}\u{1F1F9}',
  BEL: '\u{1F1E7}\u{1F1EA}', PRT: '\u{1F1F5}\u{1F1F9}', NOR: '\u{1F1F3}\u{1F1F4}',
  DNK: '\u{1F1E9}\u{1F1F0}', FIN: '\u{1F1EB}\u{1F1EE}', IRL: '\u{1F1EE}\u{1F1EA}',
  CHE: '\u{1F1E8}\u{1F1ED}', NZL: '\u{1F1F3}\u{1F1FF}', MEX: '\u{1F1F2}\u{1F1FD}',
  ARG: '\u{1F1E6}\u{1F1F7}', CZE: '\u{1F1E8}\u{1F1FF}', HUN: '\u{1F1ED}\u{1F1FA}',
  RUS: '\u{1F1F7}\u{1F1FA}', TUR: '\u{1F1F9}\u{1F1F7}', KOR: '\u{1F1F0}\u{1F1F7}',
}

export const PODIUM_MEDALS = ['\u{1F947}', '\u{1F948}', '\u{1F949}']

export const TYPE_LABELS = {
  championship: 'Championship',
  series: 'Series',
  event: 'Event',
}

export const SESSION_ORDER = ['PRACTICE', 'QUALIFYING', 'RACE']

/** Get sort order for session type, handling PRACTICE_N. */
function getSessionSortOrder(type) {
  const idx = SESSION_ORDER.indexOf(type)
  if (idx >= 0) return idx
  const match = type.match(/^PRACTICE_(\d+)$/)
  if (match) return 100 + parseInt(match[1])
  return 999
}

/** Format session type for display: PRACTICE_1 → "P1", QUALIFYING → "QUALIFYING" */
export function formatSessionLabel(type) {
  const match = type.match(/^PRACTICE_(\d+)$/)
  if (match) return `P${match[1]}`
  return type
}

// ─── Rank badge (reuses leaderboard pvx-rank classes) ─────────────────────

export function CompRankBadge({ position }) {
  const cls =
    position === 1 ? 'pvx-rank pvx-rank--gold'
      : position === 2 ? 'pvx-rank pvx-rank--silver'
        : position === 3 ? 'pvx-rank pvx-rank--bronze'
          : 'pvx-rank'
  return <span className={cls}>{position}</span>
}

// ─── Nation flag ───────────────────────────────────────────────────────────

export function NationFlag({ nation }) {
  const flag = nation && NATION_FLAGS[nation]
  if (!flag) return null
  return <span className="pvx-nation-flag" title={nation}>{flag}</span>
}

// ─── Session tab bar ──────────────────────────────────────────────────────

export function SessionTabs({ sessions, activeSession, onSelect }) {
  if (!sessions || sessions.length <= 1) return null

  const sorted = [...sessions].sort(
    (a, b) => getSessionSortOrder(a.type) - getSessionSortOrder(b.type)
  )

  return (
    <div className="pvx-session-tabs">
      {sorted.map((s) => (
        <button
          key={s.type}
          onClick={() => onSelect(s.type)}
          className={`pvx-session-tab ${activeSession === s.type ? 'pvx-session-tab--active' : ''}`}
        >
          {formatSessionLabel(s.type)}
        </button>
      ))}
    </div>
  )
}

// ─── Competition type badge ───────────────────────────────────────────────

export function TypeBadge({ type }) {
  return (
    <span className={`pvx-comp-badge pvx-comp-badge--${type}`}>
      {TYPE_LABELS[type] || type}
    </span>
  )
}

// ─── Info pill ────────────────────────────────────────────────────────────

export function InfoPill({ children, variant = 'default' }) {
  return (
    <span className={`pvx-info-pill ${variant !== 'default' ? `pvx-info-pill--${variant}` : ''}`}>
      {children}
    </span>
  )
}

// ─── Format date/time for schedule display ────────────────────────────────

export function formatScheduleDate(isoString) {
  if (!isoString) return 'TBD'
  const d = new Date(isoString)
  if (isNaN(d)) return 'TBD'
  const date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${date} \u2022 ${time}`
}

// ─── Compute fastest splits across all results in a session ───────────────

export function calcFastestSplits(results) {
  return results.reduce((best, result) => {
    if (!result.splits?.length) return best
    if (!best) return [...result.splits]
    return best.map((s, i) => {
      const current = result.splits[i]
      if (!current) return s
      return current < s ? current : s
    })
  }, null)
}

// ─── Loading / Empty states ───────────────────────────────────────────────

export function CompLoadingState({ message = 'Loading...' }) {
  return <div className="pvx-loading">{message}</div>
}

export function CompEmptyState({ message = 'No data available.' }) {
  return <div className="pvx-empty"><p>{message}</p></div>
}

// ─── Completion status helpers ────────────────────────────────────────────

/**
 * Default grace period (days) after the final round during which a completed
 * competition is considered "recently completed" and still surfaced in the
 * default (active) view.
 */
export const DEFAULT_COMPLETION_GRACE_DAYS = 3

/**
 * Returns true if the competition has rounds and every round is finalised.
 * Admin-controlled and therefore the source of truth for "this competition
 * is done".
 */
export function isCompetitionComplete(comp) {
  const rounds = comp?.rounds
  if (!rounds?.length) return false
  return rounds.every((r) => r.isFinalized)
}

/**
 * Returns the latest round's startTime as a Date (or null). Useful as the
 * completion timestamp for grace-period calculations.
 */
export function getCompletionDate(comp) {
  const rounds = comp?.rounds
  if (!rounds?.length) return null
  let latest = null
  for (const r of rounds) {
    if (!r.startTime) continue
    const d = new Date(r.startTime)
    if (isNaN(d)) continue
    if (!latest || d > latest) latest = d
  }
  return latest
}

/**
 * Classify a competition as 'active', 'recently-completed', or 'archived'.
 * - 'active': still has unfinalised rounds (or no rounds yet)
 * - 'recently-completed': all rounds finalised within the last `graceDays`
 * - 'archived': all rounds finalised longer ago than `graceDays`
 */
export function getCompetitionStatus(comp, graceDays = DEFAULT_COMPLETION_GRACE_DAYS) {
  if (!isCompetitionComplete(comp)) return 'active'
  const completedAt = getCompletionDate(comp)
  if (!completedAt) return 'recently-completed'
  const graceMs = graceDays * 24 * 60 * 60 * 1000
  return (Date.now() - completedAt.getTime()) <= graceMs
    ? 'recently-completed'
    : 'archived'
}

/**
 * Filter a list of competitions to those whose status is in `statuses`.
 */
export function filterCompetitionsByStatus(competitions, statuses, graceDays = DEFAULT_COMPLETION_GRACE_DAYS) {
  if (!competitions?.length) return []
  const allowed = new Set(Array.isArray(statuses) ? statuses : [statuses])
  return competitions.filter((c) => allowed.has(getCompetitionStatus(c, graceDays)))
}

/**
 * Extract the top N drivers from a standings payload (shape:
 * { standings: [{ position, driverName, nation, totalPoints, ... }, ...] }).
 * Returns an empty array if standings aren't available.
 */
export function getCompetitionPodium(standings, topN = 3) {
  const list = standings?.standings
  if (!Array.isArray(list)) return []
  return [...list]
    .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
    .slice(0, topN)
}
