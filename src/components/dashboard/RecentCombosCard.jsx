import { formatLapTime, formatCarName, formatTrackName, formatRelativeTime } from '../../utils/format.js'

/**
 * Recent combos list — every (track, layout, car, game, version) the driver
 * has touched, sorted by lastDrivenAt desc. Each row shows where they stand
 * on that combo's leaderboard (rank/total + gap to leader) plus their PB.
 *
 * Trophy icon appears next to rank when the driver leads the combo *and*
 * there's more than one driver on the leaderboard (no point celebrating
 * a record set on an empty board).
 *
 * The component is presentational only — consumers pass `onComboSelect`
 * to wire row clicks to their own routing (typically a leaderboard URL
 * with `highlight=<steamId>`). When no callback is provided, rows render
 * as static.
 *
 * @param {object} props
 * @param {Array} props.combos - combos array from useDriverCombos().data
 * @param {(combo: object) => void} [props.onComboSelect] - row click handler
 * @param {string} [props.className]
 */
export function RecentCombosCard({ combos, onComboSelect, className = '' }) {
  if (!combos?.length) return null

  return (
    <div className={`pvx-card ${className}`}>
      <div className="pvx-card-header">
        <h3 className="pvx-card-title">
          <span className="pvx-dash-combos-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          Recent Combos
          <span className="pvx-dash-combos-count">({combos.length})</span>
        </h3>
      </div>
      <div className="pvx-dash-combos-list">
        {combos.map((combo) => (
          <ComboRow
            key={`${combo.trackId}|${combo.trackLayout || ''}|${combo.carId}|${combo.game || ''}|${combo.gameVersion || ''}`}
            combo={combo}
            onClick={onComboSelect ? () => onComboSelect(combo) : null}
          />
        ))}
      </div>
    </div>
  )
}

function ComboRow({ combo, onClick }) {
  const game = combo.game || 'evo'
  const gapSec =
    combo.gapToLeaderMs && combo.gapToLeaderMs > 0
      ? (combo.gapToLeaderMs / 1000).toFixed(3)
      : null
  const isLeader = combo.rank === 1 && combo.totalDrivers > 1

  const className = `pvx-dash-combo-row${onClick ? ' pvx-dash-combo-row--clickable' : ''}`

  const handleKeyDown = (e) => {
    if (!onClick) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className={className}
      onClick={onClick || undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="pvx-dash-combo-info">
        <div className="pvx-dash-combo-title">
          {combo.game && (
            <span className={`pvx-dash-game-badge pvx-dash-game-badge--${game}`}>
              {game.toUpperCase()}
            </span>
          )}
          <span className="pvx-dash-combo-track">
            {formatTrackName(combo.trackId, combo.trackLayout, combo.game)}
          </span>
        </div>
        <div className="pvx-dash-combo-meta">
          <span className="pvx-dash-combo-car">{formatCarName(combo.carId)}</span>
          {combo.lapCount > 0 && (
            <>
              <span className="pvx-dash-combo-meta-sep">·</span>
              <span>
                {combo.lapCount} {combo.lapCount === 1 ? 'lap' : 'laps'}
              </span>
            </>
          )}
          {combo.lastDrivenAt && (
            <>
              <span className="pvx-dash-combo-meta-sep">·</span>
              <span>{formatRelativeTime(combo.lastDrivenAt)}</span>
            </>
          )}
        </div>
      </div>
      <div className="pvx-dash-combo-stats">
        {combo.rank ? (
          <span className="pvx-dash-combo-rank">
            {isLeader && (
              <span className="pvx-dash-combo-trophy" aria-label="Leader" title="Leader">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
                  <path d="M18 2H6v7a6 6 0 0012 0V2z" />
                </svg>
              </span>
            )}
            <span className="pvx-dash-combo-rank-text">
              P{combo.rank}
              {combo.totalDrivers ? <span className="pvx-dash-combo-rank-total">/{combo.totalDrivers}</span> : null}
            </span>
          </span>
        ) : combo.totalDrivers ? (
          <span className="pvx-dash-combo-rank-text pvx-dash-combo-rank-text--muted">
            {combo.totalDrivers} on leaderboard
          </span>
        ) : null}
        {gapSec && <span className="pvx-dash-combo-gap">+{gapSec}</span>}
        {combo.personalBestMs && (
          <span className="pvx-dash-combo-pb">{formatLapTime(combo.personalBestMs)}</span>
        )}
      </div>
    </div>
  )
}
