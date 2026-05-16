/**
 * Round results components.
 *
 * **RoundResults** — standalone component that fetches round data by competitionId + roundNumber,
 * then renders a header (title, date, podium) plus session tabs and results table.
 *
 * **RoundSessionResults** — pure presentation component that accepts round data as a prop
 * and renders session tabs + results table. No header, no data fetching.
 * Used by the accordion in CompetitionExplorer where the parent already has the data
 * and displays the header in the accordion toggle.
 *
 * @module RoundResults
 */

import { useState } from 'react'
import {
  useCompetitionRound,
  useCompetitionRoundLaps,
  useCompetitionRoundPositions,
} from '../../hooks/useCompetitions.js'
import { formatCarName } from '../../utils/format.js'
import { RacePositionsChart } from './RacePositionsChart.jsx'
import {
  CompRankBadge,
  NationFlag,
  SessionTabs,
  SESSION_ORDER,
  PODIUM_MEDALS,
  calcFastestSplits,
  CompLoadingState,
  CompEmptyState,
} from './shared.jsx'

/**
 * Standalone round results — fetches data and renders header + sessions.
 *
 * @param {object} props
 * @param {string} props.competitionId
 * @param {number} props.roundNumber
 * @param {string} [props.className]
 */
export function RoundResults({ competitionId, roundNumber, className }) {
  const { data: round, isLoading } = useCompetitionRound(competitionId, roundNumber)

  if (isLoading) {
    return <CompLoadingState message="Loading results..." />
  }

  if (!round) {
    return <CompEmptyState message="No results for this round." />
  }

  const sessions = round.sessions || []
  const raceSession = sessions.find((s) => s.type === 'RACE')
  const podium = raceSession?.results?.filter((r) => r.position <= 3).sort((a, b) => a.position - b.position)

  return (
    <div className={`pvx-round-results ${className || ''}`}>
      <div className="pvx-round-results-header">
        <div>
          <h4 className="pvx-round-results-title">
            Round {round.roundNumber}{round.track ? `: ${round.track}` : ''}
          </h4>
          {round.startTime && (
            <p className="pvx-round-results-date">
              {new Date(round.startTime).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          )}
        </div>
        {podium?.length > 0 && (
          <div className="pvx-round-podium-summary">
            {podium.map((r) => (
              <span key={r.driverId} className="pvx-round-podium-item">
                <span>{PODIUM_MEDALS[r.position - 1]}</span>
                <span>{r.driverName}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <RoundSessionResults round={round} competitionId={competitionId} />
    </div>
  )
}

/**
 * Session tabs + results table for a round. No header, no data fetching.
 * Accepts round data directly as a prop.
 *
 * @param {object} props
 * @param {object} props.round - Round data object with sessions array
 * @param {string} [props.competitionId] - If provided, enables per-driver lap detail (fetched from CDN)
 * @param {string} [props.className]
 */
export function RoundSessionResults({ round, competitionId, className }) {
  const [activeSession, setActiveSession] = useState(null)

  const sessions = round?.sessions || []
  if (!sessions.length) {
    return <CompEmptyState message="No session data for this round." />
  }

  // Fetch per-driver lap detail if competitionId is provided
  const { data: lapData } = useCompetitionRoundLaps(
    competitionId, round?.roundNumber, { enabled: !!competitionId }
  )

  // Race-position progression (LMU only; returns null otherwise). Only fetch
  // when the round actually has a Race session.
  const hasRaceSession = sessions.some((s) => s.type === 'RACE')
  const { data: positionsData } = useCompetitionRoundPositions(
    competitionId, round?.roundNumber, { enabled: !!competitionId && hasRaceSession }
  )

  const effectiveSession = activeSession
    || sessions.find((s) => s.type === 'RACE')?.type
    || sessions[0]?.type

  const currentSession = sessions.find((s) => s.type === effectiveSession) || sessions[0]

  // Find lap data for the current session type
  const sessionLaps = lapData?.sessions?.find((s) => s.type === effectiveSession)?.drivers || null

  const showPositions = currentSession?.type === 'RACE'
    && positionsData?.timingPoints?.length > 0
    && positionsData?.drivers?.length > 0

  return (
    <div className={className || ''}>
      <SessionTabs
        sessions={sessions}
        activeSession={effectiveSession}
        onSelect={setActiveSession}
      />

      <SessionResultsTable session={currentSession} sessionLaps={sessionLaps} />

      {showPositions && (
        <div className="pvx-positions-section">
          <div className="pvx-positions-section-title">Race Positions</div>
          <RacePositionsChart positions={positionsData} />
        </div>
      )}
    </div>
  )
}

// ─── Internal components ────────────────────────────────────────

function SessionResultsTable({ session, sessionLaps }) {
  const isRace = session.type === 'RACE'
  const [expandedDriver, setExpandedDriver] = useState(null)

  if (!session.results?.length) {
    return <CompEmptyState message={`No results for ${session.type}.`} />
  }

  const fastestSplits = calcFastestSplits(session.results)
  const colCount = isRace ? 7 : 4

  // Multi-class (LMU): if results carry >1 distinct carClass, render a class
  // header row before each class block and rank within the class. EVO results
  // have no carClass → single ungrouped block, unchanged behaviour.
  const classes = [...new Set(session.results.map((r) => r.carClass).filter(Boolean))]
  const isMultiClass = classes.length > 1

  const renderRow = (result, index, displayPosition) => {
    const driverLaps = sessionLaps?.[result.driverId]?.laps
    const isExpanded = expandedDriver === result.driverId && !!driverLaps
    return (
      <SessionResultRow
        key={result.driverId || index}
        result={result}
        isRace={isRace}
        fastestSplits={fastestSplits}
        rowIndex={index}
        displayPosition={displayPosition}
        hasLapDetail={!!driverLaps}
        isExpanded={isExpanded}
        onToggle={() => setExpandedDriver(isExpanded ? null : result.driverId)}
        driverLaps={isExpanded ? driverLaps : null}
        colCount={colCount}
      />
    )
  }

  return (
    <div className="pvx-table-scroll">
      <table className="pvx-table">
        <thead>
          <tr className="pvx-thead-row">
            <th className="pvx-th pvx-th--narrow">Pos</th>
            <th className="pvx-th">Driver</th>
            <th className="pvx-th pvx-hidden-below-sm">Car</th>
            <th className="pvx-th">Best Lap</th>
            {isRace && (
              <>
                <th className="pvx-th pvx-hidden-below-sm">Laps</th>
                <th className="pvx-th pvx-hidden-below-sm">Time / Gap</th>
                <th className="pvx-th pvx-th--center">Points</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="pvx-tbody">
          {isMultiClass
            ? classes.sort().map((cls) => {
                const rows = session.results
                  .filter((r) => r.carClass === cls)
                  .sort((a, b) => (a.classPosition ?? a.position) - (b.classPosition ?? b.position))
                return [
                  <tr key={`hdr-${cls}`} className="pvx-row pvx-row--class-header">
                    <td colSpan={colCount} className="pvx-td pvx-td--class-header">{cls}</td>
                  </tr>,
                  ...rows.map((result, i) =>
                    renderRow(result, i, result.classPosition ?? result.position)
                  ),
                ]
              })
            : session.results.map((result, index) => renderRow(result, index))}
        </tbody>
      </table>
    </div>
  )
}

function SessionResultRow({ result, isRace, fastestSplits, rowIndex, displayPosition, hasLapDetail, isExpanded, onToggle, driverLaps, colCount }) {
  const pos = displayPosition ?? result.position
  const isTopThree = pos <= 3

  return (
    <>
      <tr
        className={`pvx-row ${isTopThree ? 'pvx-row--podium' : ''} ${hasLapDetail ? 'pvx-row--expandable' : ''}`}
        onClick={hasLapDetail ? onToggle : undefined}
        style={hasLapDetail ? { cursor: 'pointer' } : undefined}
      >
        <td className="pvx-td">
          <CompRankBadge position={pos} />
        </td>
        <td className="pvx-td pvx-td--primary">
          <NationFlag nation={result.nation} />
          {result.driverName}
          {result.carNumber != null && (
            <span className="pvx-car-number">#{result.carNumber}</span>
          )}
          {result.penalty && (
            <span className="pvx-penalty">{result.penalty}</span>
          )}
        </td>
        <td className="pvx-td pvx-hidden-below-sm">
          {formatCarName(result.carId)}
        </td>
        <td className="pvx-td pvx-td--mono">
          <BestLapCell
            bestLap={result.bestLapFormatted}
            hasBestLap={result.hasBestLap}
            splits={result.splits}
            fastestSplits={fastestSplits}
            showAbove={rowIndex <= 1}
          />
        </td>
        {isRace && (
          <>
            <td className="pvx-td pvx-hidden-below-sm">{result.lapsCompleted}</td>
            <td className="pvx-td pvx-td--mono pvx-td--muted pvx-hidden-below-sm">
              {result.position === 1 ? (result.totalTime || '-') : (result.gap || '-')}
            </td>
            <td className="pvx-td pvx-td--center">
              <span className="pvx-session-points">{result.points}</span>
              {result.pointsOverride !== 0 && result.pointsOverride && (
                <span className="pvx-points-override">
                  ({result.pointsOverride > 0 ? '+' : ''}{result.pointsOverride})
                </span>
              )}
            </td>
          </>
        )}
      </tr>
      {isExpanded && driverLaps && (
        <tr className="pvx-row pvx-row--lap-detail">
          <td colSpan={colCount} className="pvx-td pvx-td--lap-detail">
            <DriverLapTable laps={driverLaps} />
          </td>
        </tr>
      )}
    </>
  )
}

function DriverLapTable({ laps }) {
  // Find fastest valid lap for highlighting
  const fastestTime = Math.min(...laps.filter((l) => l.valid && l.timeMs > 0).map((l) => l.timeMs))

  return (
    <table className="pvx-table pvx-table--laps">
      <thead>
        <tr className="pvx-thead-row">
          <th className="pvx-th pvx-th--narrow">Lap</th>
          <th className="pvx-th">Time</th>
          <th className="pvx-th pvx-hidden-below-sm">S1</th>
          <th className="pvx-th pvx-hidden-below-sm">S2</th>
          <th className="pvx-th pvx-hidden-below-sm">S3</th>
        </tr>
      </thead>
      <tbody className="pvx-tbody">
        {laps.map((lap) => {
          const isFastest = lap.valid && lap.timeMs === fastestTime
          return (
            <tr key={lap.lap} className={`pvx-row ${!lap.valid ? 'pvx-row--invalid' : ''} ${isFastest ? 'pvx-row--fastest' : ''}`}>
              <td className="pvx-td pvx-td--muted">{lap.lap}</td>
              <td className="pvx-td pvx-td--mono">{lap.time}</td>
              {(lap.splits || []).map((s, i) => (
                <td key={i} className="pvx-td pvx-td--mono pvx-td--muted pvx-hidden-below-sm">{s}</td>
              ))}
              {/* Pad missing split columns */}
              {Array.from({ length: Math.max(0, 3 - (lap.splits?.length || 0)) }).map((_, i) => (
                <td key={`pad-${i}`} className="pvx-td pvx-hidden-below-sm" />
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function BestLapCell({ bestLap, hasBestLap, splits, fastestSplits, showAbove }) {
  if (!bestLap) return <span className="pvx-td--muted">-</span>

  return (
    <span className={`pvx-best-lap-cell ${hasBestLap ? 'pvx-best-lap-cell--fastest' : ''}`}>
      <span className="pvx-best-lap-time">{bestLap}</span>
      {splits?.length > 0 && (
        <span className="pvx-splits-tooltip-anchor">
          <span className={`pvx-splits-tooltip ${showAbove ? '' : 'pvx-splits-tooltip--above'}`}>
            {splits.map((split, i) => {
              const isFastest = fastestSplits && split === fastestSplits[i]
              return (
                <span key={i} className="pvx-splits-tooltip-row">
                  <span className="pvx-splits-tooltip-label">S{i + 1}</span>
                  <span className={isFastest ? 'pvx-splits-tooltip-best' : ''}>{split}</span>
                </span>
              )
            })}
          </span>
        </span>
      )}
    </span>
  )
}
