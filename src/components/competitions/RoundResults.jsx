/**
 * Styled round results with session tabs and rich detail.
 * Shows session tab bar (Practice/Qualifying/Race), then a results table
 * with position, driver, car, best lap (with sector tooltip), laps, gap, and points.
 *
 * @param {object} props
 * @param {string} props.competitionId
 * @param {number} props.roundNumber
 * @param {string} [props.className] - Additional class on root container
 */

import { useState } from 'react'
import { useCompetitionRound } from '../../hooks/useCompetitions.js'
import { formatCarName } from '../../utils/format.js'
import {
  CompRankBadge,
  NationFlag,
  SessionTabs,
  SESSION_ORDER,
  calcFastestSplits,
  CompLoadingState,
  CompEmptyState,
} from './shared.jsx'

export function RoundResults({ competitionId, roundNumber, className }) {
  const { data: round, isLoading } = useCompetitionRound(competitionId, roundNumber)
  const [activeSession, setActiveSession] = useState(null)

  if (isLoading) {
    return <CompLoadingState message="Loading results..." />
  }

  if (!round) {
    return <CompEmptyState message="No results for this round." />
  }

  const sessions = round.sessions || []
  if (!sessions.length) {
    return <CompEmptyState message="No session data for this round." />
  }

  // Default to RACE if available, otherwise first session
  const effectiveSession = activeSession
    || sessions.find((s) => s.type === 'RACE')?.type
    || sessions[0]?.type

  const currentSession = sessions.find((s) => s.type === effectiveSession) || sessions[0]

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
        <RoundPodiumSummary sessions={sessions} />
      </div>

      <SessionTabs
        sessions={sessions}
        activeSession={effectiveSession}
        onSelect={setActiveSession}
      />

      <SessionResultsTable session={currentSession} />
    </div>
  )
}

function RoundPodiumSummary({ sessions }) {
  const raceSession = sessions.find((s) => s.type === 'RACE')
  const podium = raceSession?.results?.filter((r) => r.position <= 3).sort((a, b) => a.position - b.position)
  if (!podium?.length) return null

  const MEDALS = ['\u{1F947}', '\u{1F948}', '\u{1F949}']
  return (
    <div className="pvx-round-podium-summary">
      {podium.map((r) => (
        <span key={r.driverId} className="pvx-round-podium-item">
          <span>{MEDALS[r.position - 1]}</span>
          <span>{r.driverName}</span>
        </span>
      ))}
    </div>
  )
}

function SessionResultsTable({ session }) {
  const isRace = session.type === 'RACE'

  if (!session.results?.length) {
    return <CompEmptyState message={`No results for ${session.type}.`} />
  }

  const fastestSplits = calcFastestSplits(session.results)

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
          {session.results.map((result, index) => (
            <SessionResultRow
              key={result.driverId || index}
              result={result}
              isRace={isRace}
              fastestSplits={fastestSplits}
              rowIndex={index}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SessionResultRow({ result, isRace, fastestSplits, rowIndex }) {
  const isTopThree = result.position <= 3

  return (
    <tr className={`pvx-row ${isTopThree ? 'pvx-row--podium' : ''}`}>
      <td className="pvx-td">
        <CompRankBadge position={result.position} />
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
