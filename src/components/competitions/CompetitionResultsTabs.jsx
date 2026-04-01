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
import { useCompetitionConfig, useCompetitionAllRounds } from '../../hooks/useCompetitions.js'
import { StandingsTable } from './StandingsTable.jsx'
import { RoundSessionResults } from './RoundResults.jsx'
import { PODIUM_MEDALS, CompLoadingState, CompEmptyState } from './shared.jsx'

export function CompetitionResultsTabs({ competitionId, className }) {
  const { data: config, isLoading: configLoading } = useCompetitionConfig(competitionId)

  const isChampionship = config?.type === 'championship'
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

  // Default tab: "standings" for championships, latest round for others
  const defaultTab = isChampionship
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
  for (const fr of finalizedRounds) {
    tabs.push({
      id: `round-${fr.roundNumber}`,
      label: `R${fr.roundNumber}`,
      track: null,
    })
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
      ) : selectedRound ? (
        <RoundContent round={selectedRound} />
      ) : (
        <CompEmptyState message="No results for this round." />
      )}
    </div>
  )
}

/**
 * Round content panel — header with track/date/podium + session results.
 */
function RoundContent({ round }) {
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

      <RoundSessionResults round={round} />
    </div>
  )
}
