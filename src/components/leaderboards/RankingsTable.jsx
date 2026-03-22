import { useMemo, useState } from 'react'
import { formatLapTime, formatCarName, formatTrackName } from '../../utils/format.js'
import {
  useSortConfig, sortEntries,
  SortTh, DriverCell, RankBadge, EmptyState, LoadingState,
} from './shared.jsx'

/**
 * Rankings table — displays driver ratings across all car/track combos.
 *
 * @param {object} props
 * @param {Array} props.drivers - Driver ratings array from useDriverRatings
 * @param {boolean} props.isLoading
 * @param {Function} props.getUserDisplay - From useUserLookup
 * @param {string} props.game - Current game filter ('evo' | 'acc')
 * @param {string} [props.gameVersion] - Current game version
 * @param {(params: { track, car, highlight }) => void} [props.onComboSelect] - Callback when a combo is clicked
 */
export function RankingsTable({ drivers, isLoading, getUserDisplay, game, gameVersion, onComboSelect }) {
  const [sortConfig, onSort] = useSortConfig({ key: 'rank', dir: 'asc' })
  const [expandedDriver, setExpandedDriver] = useState(null)

  const sorted = useMemo(() => {
    if (!drivers) return []
    return sortEntries(drivers, sortConfig, (d, key) => {
      switch (key) {
        case 'rating': return d.rating
        case 'comboCount': return d.comboCount || 0
        case 'distinctCars': return d.distinctCars || 0
        case 'rank': default: return d.rank
      }
    })
  }, [drivers, sortConfig])

  if (isLoading) return <LoadingState />

  if (!drivers?.length) {
    return (
      <div className="pvx-card">
        <EmptyState message="Not enough data for rankings yet." />
      </div>
    )
  }

  const colCount = 5

  return (
    <div className="pvx-card">
      <div className="pvx-card-header pvx-rankings-header">
        <h2 className="pvx-card-title">Driver Rankings</h2>
        <div className="pvx-rankings-info-trigger">
          <svg className="pvx-rankings-info-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div className="pvx-rankings-info-tooltip">
            <p className="pvx-rankings-info-title">How ratings work</p>
            <ul className="pvx-rankings-info-list">
              <li>For each car/track combo with 3+ drivers, you're ranked by lap time and given a percentile (100 = fastest, 0 = slowest)</li>
              <li>Your rating is a weighted average across all your combos — bigger fields count more</li>
              <li>A confidence adjustment rewards car diversity: the more different cars you drive competitively, the closer your rating reflects your true score</li>
              <li>Minimum 2 qualifying combos required</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="pvx-table-scroll">
        <table className="pvx-table">
          <thead>
            <tr className="pvx-thead-row">
              <SortTh label="#" sortKey="rank" config={sortConfig} onSort={onSort} className="pvx-th--narrow" />
              <th className="pvx-th">Driver</th>
              <SortTh label="Rating" sortKey="rating" config={sortConfig} onSort={onSort} />
              <SortTh label="Cars" sortKey="distinctCars" config={sortConfig} onSort={onSort} className="pvx-hidden-below-sm" />
              <SortTh label="Combos" sortKey="comboCount" config={sortConfig} onSort={onSort} className="pvx-hidden-below-sm" />
            </tr>
          </thead>
          <tbody className="pvx-tbody">
            {sorted.map((driver) => {
              const isExpanded = expandedDriver === driver.identifier
              return (
                <RankingsRow
                  key={driver.identifier}
                  driver={driver}
                  getUserDisplay={getUserDisplay}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedDriver(isExpanded ? null : driver.identifier)}
                  colCount={colCount}
                  game={game}
                  gameVersion={gameVersion}
                  onComboSelect={onComboSelect}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RankingsRow({ driver, getUserDisplay, isExpanded, onToggle, colCount, game, gameVersion, onComboSelect }) {
  const visibleId = driver.identifier

  return (
    <>
      <tr
        className={`pvx-row pvx-row--clickable ${driver.rank <= 3 ? 'pvx-row--podium' : ''}`}
        onClick={onToggle}
      >
        <td className="pvx-td"><RankBadge rank={driver.rank} podium /></td>
        <td className="pvx-td pvx-td--primary"><DriverCell userId={visibleId} getUserDisplay={getUserDisplay} /></td>
        <td className="pvx-td pvx-td--primary pvx-td--mono">{driver.rating.toFixed(1)}</td>
        <td className="pvx-td pvx-td--center pvx-hidden-below-sm">{driver.distinctCars || '-'}</td>
        <td className="pvx-td pvx-td--center pvx-hidden-below-sm">
          <span className="pvx-rankings-combo-count">
            {driver.comboCount}
            <svg className={`pvx-rankings-chevron ${isExpanded ? 'pvx-rankings-chevron--open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </td>
      </tr>
      {isExpanded && driver.combos && (
        <tr>
          <td colSpan={colCount} className="pvx-rankings-combos-cell">
            <div className="pvx-rankings-combos">
              {driver.combos.map((combo, i) => {
                const trackKey = combo.layout ? `${combo.trackId}|${combo.layout}` : combo.trackId
                const handleClick = onComboSelect
                  ? () => onComboSelect({ track: trackKey, car: combo.carId, highlight: visibleId, game, gameVersion })
                  : undefined

                return (
                  <div
                    key={i}
                    className={`pvx-rankings-combo ${handleClick ? 'pvx-rankings-combo--clickable' : ''}`}
                    onClick={handleClick}
                    role={handleClick ? 'button' : undefined}
                  >
                    <div className="pvx-rankings-combo-info">
                      <p className="pvx-rankings-combo-track">
                        {formatTrackName(combo.trackId, combo.layout, game)}
                      </p>
                      <p className="pvx-rankings-combo-car">{formatCarName(combo.carId)}</p>
                    </div>
                    <div className="pvx-rankings-combo-stats">
                      <p className="pvx-rankings-combo-time">{formatLapTime(combo.lapTimeMs)}</p>
                      <p className={`pvx-rankings-combo-pct ${
                        combo.percentile >= 75 ? 'pvx-rankings-combo-pct--high' :
                        combo.percentile >= 50 ? 'pvx-rankings-combo-pct--mid' :
                        combo.percentile >= 25 ? 'pvx-rankings-combo-pct--low' :
                        'pvx-rankings-combo-pct--bottom'
                      }`}>
                        {combo.percentile.toFixed(0)}%
                        <span className="pvx-rankings-combo-rank">
                          ({combo.rank}/{combo.totalDrivers})
                        </span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
