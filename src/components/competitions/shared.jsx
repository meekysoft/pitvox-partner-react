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
    (a, b) => SESSION_ORDER.indexOf(a.type) - SESSION_ORDER.indexOf(b.type)
  )

  return (
    <div className="pvx-session-tabs">
      {sorted.map((s) => (
        <button
          key={s.type}
          onClick={() => onSelect(s.type)}
          className={`pvx-session-tab ${activeSession === s.type ? 'pvx-session-tab--active' : ''}`}
        >
          {s.type}
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
