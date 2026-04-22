/**
 * Tabbed competition results view.
 *
 * Championships: "Standings" tab (default) + one tab per finalized round.
 * Series/Events: Round tabs only, defaulting to the most recent finalized round.
 *
 * @param {object} props
 * @param {string} props.competitionId
 * @param {string} [props.className]
 */

import { useState, useMemo } from 'react'
import { useCompetitionConfig, useCompetitionAllRounds, useCompetitionLeaderboard } from '../../hooks/useCompetitions.js'
import { formatCarName } from '../../utils/format.js'
import { StandingsTable } from './StandingsTable.jsx'
import { RoundSessionResults } from './RoundResults.jsx'
import { PODIUM_MEDALS, CompLoadingState, CompEmptyState, CompRankBadge, NationFlag, formatSessionLabel } from './shared.jsx'

export function CompetitionResultsTabs({ competitionId, className }) {
  const { data: config, isLoading: configLoading } = useCompetitionConfig(competitionId)

  const isChampionship = config?.type === 'championship'
  const isHotlap = config?.type === 'hotlap'

  const { data: leaderboard } = useCompetitionLeaderboard(isHotlap ? competitionId : null)

  const finalizedRounds = useMemo(
    () => config?.rounds?.filter((r) => r.isFinalized) || [],
    [config],
  )
  const roundNumbers = useMemo(
    () => finalizedRounds.map((r) => r.roundNumber),
    [finalizedRounds],
  )

  const { data: rounds = [], isLoading: roundsLoading } = useCompetitionAllRounds(
    competitionId,
    roundNumbers,
  )

  // For hotlap: extract session types from the single round
  const hotlapRound = isHotlap && rounds.length > 0 ? rounds[0] : null
  const hotlapSessions = hotlapRound?.sessions || []

  // Default tab
  const defaultTab = isHotlap
    ? 'leaderboard'
    : isChampionship
      ? 'standings'
      : roundNumbers.length > 0
        ? `round-${roundNumbers[roundNumbers.length - 1]}`
        : null

  const [activeTab, setActiveTab] = useState(null)
  const effectiveTab = activeTab || defaultTab

  if (configLoading || roundsLoading) {
    return <CompLoadingState message="Loading results..." />
  }

  if (!config) {
    return <CompEmptyState message="Competition not found." />
  }

  if (!finalizedRounds.length) {
    return <CompEmptyState message="No results available yet. Results will appear here once rounds are finalised." />
  }

  // Build round lookup for quick access
  const roundMap = new Map(rounds.map((r) => [`round-${r.roundNumber}`, r]))

  // Build tab definitions
  const tabs = []
  if (isChampionship) {
    tabs.push({ id: 'standings', label: 'Standings' })
  }
  if (isHotlap) {
    tabs.push({ id: 'leaderboard', label: 'Leaderboard' })
    for (const session of hotlapSessions) {
      tabs.push({ id: `session-${session.type}`, label: formatSessionLabel(session.type) })
    }
  } else {
    for (const fr of finalizedRounds) {
      tabs.push({
        id: `round-${fr.roundNumber}`,
        label: `R${fr.roundNumber}`,
        track: null,
      })
    }
  }

  const selectedRound = roundMap.get(effectiveTab)

  return (
    <div className={className || ''}>
      {/* Tab bar */}
      <div className="pvx-results-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`pvx-results-tab ${effectiveTab === tab.id ? 'pvx-results-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.track || undefined}
          >
            <span className="pvx-results-tab-label">{tab.label}</span>
            {tab.track && (
              <span className="pvx-results-tab-track">{tab.track}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {effectiveTab === 'standings' ? (
        <StandingsTable competitionId={competitionId} />
      ) : effectiveTab === 'leaderboard' ? (
        <HotlapLeaderboard leaderboard={leaderboard} config={config} />
      ) : effectiveTab?.startsWith('session-') ? (
        <HotlapSessionContent
          session={hotlapSessions.find((s) => `session-${s.type}` === effectiveTab)}
          round={hotlapRound}
          competitionId={competitionId}
        />
      ) : selectedRound ? (
        <RoundContent round={selectedRound} competitionId={competitionId} />
      ) : (
        <CompEmptyState message="No results for this round." />
      )}
    </div>
  )
}

/**
 * Round content panel — header with track/date/podium + session results.
 */
function RoundContent({ round, competitionId }) {
  const sessions = round.sessions || []
  const raceSession = sessions.find((s) => s.type === 'RACE')
  const podium = raceSession?.results
    ?.filter((r) => r.position <= 3)
    .sort((a, b) => a.position - b.position)

  return (
    <div className="pvx-card">
      <div className="pvx-card-header--split">
        <div>
          <h4 className="pvx-card-title">
            Round {round.roundNumber}{round.track ? `: ${round.track}` : ''}
          </h4>
          {round.startTime && (
            <span className="pvx-standings-subtitle">
              {new Date(round.startTime).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
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
 * Hotlap leaderboard: aggregate best lap per driver across all practice sessions.
 */
function HotlapLeaderboard({ leaderboard, config }) {
  if (!leaderboard?.drivers?.length) {
    return <CompEmptyState message="No lap times recorded yet." />
  }

  return (
    <div className="pvx-card">
      <div className="pvx-card-header--split">
        <div>
          <h4 className="pvx-card-title">
            {leaderboard.track || config?.name || 'Hotlap Leaderboard'}
          </h4>
          <span className="pvx-standings-subtitle">
            {leaderboard.sessionsCompleted} session{leaderboard.sessionsCompleted !== 1 ? 's' : ''} completed
          </span>
        </div>
      </div>
      <div className="pvx-table-scroll">
        <table className="pvx-table">
          <thead>
            <tr className="pvx-thead-row">
              <th className="pvx-th pvx-th--narrow">Pos</th>
              <th className="pvx-th">Driver</th>
              <th className="pvx-th pvx-hidden-below-sm">Car</th>
              <th className="pvx-th">Best Lap</th>
              <th className="pvx-th pvx-hidden-below-sm">Laps</th>
              <th className="pvx-th pvx-hidden-below-sm">Sessions</th>
              <th className="pvx-th pvx-hidden-below-sm">Gap</th>
            </tr>
          </thead>
          <tbody className="pvx-tbody">
            {leaderboard.drivers.map((driver) => {
              const gap = driver.position === 1 ? '' :
                `+${((driver.bestLapMs - leaderboard.drivers[0].bestLapMs) / 1000).toFixed(3)}`
              return (
                <tr key={driver.driverId} className={`pvx-row ${driver.position <= 3 ? 'pvx-row--podium' : ''}`}>
                  <td className="pvx-td">
                    <CompRankBadge position={driver.position} />
                  </td>
                  <td className="pvx-td pvx-td--primary">
                    <NationFlag nation={driver.nation} />
                    {driver.driverName}
                  </td>
                  <td className="pvx-td pvx-hidden-below-sm">{formatCarName(driver.carId)}</td>
                  <td className="pvx-td pvx-td--mono">
                    <span className={driver.position === 1 ? 'pvx-best-lap-cell--fastest' : ''}>
                      {driver.bestLapFormatted}
                    </span>
                  </td>
                  <td className="pvx-td pvx-hidden-below-sm">{driver.totalLaps}</td>
                  <td className="pvx-td pvx-hidden-below-sm">{driver.sessionsParticipated}</td>
                  <td className="pvx-td pvx-td--mono pvx-td--muted pvx-hidden-below-sm">{gap}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Single session content for a hotlap competition.
 */
function HotlapSessionContent({ session, round, competitionId }) {
  if (!session) return <CompEmptyState message="Session data not available." />

  return (
    <div className="pvx-card">
      <div className="pvx-card-header">
        <h4 className="pvx-card-title">{formatSessionLabel(session.type)}</h4>
      </div>
      <RoundSessionResults
        round={{ ...round, sessions: [session] }}
        competitionId={competitionId}
      />
    </div>
  )
}
