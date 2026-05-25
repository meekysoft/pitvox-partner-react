/**
 * Tabbed competition results view.
 *
 * Championships: "Standings" tab (default) + one tab per finalized round.
 * Series/Events: Round tabs only, defaulting to the most recent finalized round.
 * Single-round hotlap: "Leaderboard" tab + one tab per practice cycle.
 * Multi-round hotlap: "Standings" tab (default) + one tab per round, each
 *   wrapping that round's leaderboard + per-cycle session sub-tabs.
 *
 * @param {object} props
 * @param {string} props.competitionId
 * @param {string} [props.className]
 */

import { useState, useMemo } from 'react'
import { useCompetitionConfig, useCompetitionAllRounds, useCompetitionLeaderboard, useCompetitionRoundLeaderboard } from '../../hooks/useCompetitions.js'
import { formatCarName } from '../../utils/format.js'
import { StandingsTable } from './StandingsTable.jsx'
import { RoundSessionResults } from './RoundResults.jsx'
import { PODIUM_MEDALS, CompLoadingState, CompEmptyState, CompRankBadge, NationFlag, formatSessionLabel, isRoundClosed } from './shared.jsx'

export function CompetitionResultsTabs({ competitionId, className }) {
  const { data: config, isLoading: configLoading } = useCompetitionConfig(competitionId)

  const isChampionship = config?.type === 'championship'
  const isHotlap = config?.type === 'hotlap'
  const configuredRounds = useMemo(() => config?.rounds || [], [config])
  const isMultiRoundHotlap = isHotlap && configuredRounds.length > 1
  const isSingleRoundHotlap = isHotlap && !isMultiRoundHotlap

  // The legacy competition-level leaderboard backs only the single-round
  // hotlap flat view. Multi-round hotlap reads per-round leaderboards instead.
  const { data: leaderboard } = useCompetitionLeaderboard(isSingleRoundHotlap ? competitionId : null)

  const finalizedRounds = useMemo(
    () => configuredRounds.filter((r) => r.isFinalized),
    [configuredRounds],
  )
  const roundNumbers = useMemo(
    () => finalizedRounds.map((r) => r.roundNumber),
    [finalizedRounds],
  )

  const { data: rounds = [], isLoading: roundsLoading } = useCompetitionAllRounds(
    competitionId,
    roundNumbers,
  )

  // Single-round hotlap: sessions come from the (only) finalized round.
  const hotlapRound = isSingleRoundHotlap && rounds.length > 0 ? rounds[0] : null
  const hotlapSessions = hotlapRound?.sessions || []

  // Default tab. For multi-round hotlap with a currently-live round, prefer
  // that round's tab over Standings — Standings is empty until the first
  // round closes, and rounds run for days/weeks so users landing here while
  // a round is live would otherwise see a dead-looking page.
  const liveHotlapRound = isMultiRoundHotlap
    ? configuredRounds.find(
        (r) => r.startTime && new Date(r.startTime) <= new Date() && !isRoundClosed(r),
      )
    : null
  const defaultTab = isMultiRoundHotlap
    ? (liveHotlapRound ? `hlround-${liveHotlapRound.roundNumber}` : 'standings')
    : isSingleRoundHotlap
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

  // Round lookups
  const roundMap = new Map(rounds.map((r) => [`round-${r.roundNumber}`, r]))
  const roundByNumber = new Map(rounds.map((r) => [r.roundNumber, r]))

  // Build tab definitions
  const tabs = []
  if (isMultiRoundHotlap) {
    // Standings + one tab per configured round (the full series calendar;
    // rounds without data yet render an empty per-round view).
    tabs.push({ id: 'standings', label: 'Standings' })
    for (const r of [...configuredRounds].sort((a, b) => a.roundNumber - b.roundNumber)) {
      tabs.push({ id: `hlround-${r.roundNumber}`, label: `R${r.roundNumber}`, track: r.track || null })
    }
  } else if (isSingleRoundHotlap) {
    tabs.push({ id: 'leaderboard', label: 'Leaderboard' })
    for (const session of hotlapSessions) {
      tabs.push({ id: `session-${session.type}`, label: formatSessionLabel(session.type) })
    }
  } else if (isChampionship) {
    tabs.push({ id: 'standings', label: 'Standings' })
    for (const fr of finalizedRounds) {
      tabs.push({ id: `round-${fr.roundNumber}`, label: `R${fr.roundNumber}`, track: null })
    }
  } else {
    for (const fr of finalizedRounds) {
      tabs.push({ id: `round-${fr.roundNumber}`, label: `R${fr.roundNumber}`, track: null })
    }
  }

  let content
  if (effectiveTab === 'standings') {
    content = <StandingsTable competitionId={competitionId} />
  } else if (effectiveTab === 'leaderboard') {
    content = <HotlapLeaderboard leaderboard={leaderboard} config={config} />
  } else if (effectiveTab?.startsWith('hlround-')) {
    const rn = parseInt(effectiveTab.slice('hlround-'.length), 10)
    const roundMeta = configuredRounds.find((r) => r.roundNumber === rn)
    content = roundMeta
      ? <HotlapRound competitionId={competitionId} roundMeta={roundMeta} roundData={roundByNumber.get(rn)} />
      : <CompEmptyState message="No results for this round." />
  } else if (effectiveTab?.startsWith('session-')) {
    content = (
      <HotlapSessionContent
        session={hotlapSessions.find((s) => `session-${s.type}` === effectiveTab)}
        round={hotlapRound}
        competitionId={competitionId}
      />
    )
  } else {
    const selectedRound = roundMap.get(effectiveTab)
    content = selectedRound
      ? <RoundContent round={selectedRound} competitionId={competitionId} />
      : <CompEmptyState message="No results for this round." />
  }

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
      {content}
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
function HotlapLeaderboard({ leaderboard, config, heading }) {
  if (!leaderboard?.drivers?.length) {
    return <CompEmptyState message="No lap times recorded yet." />
  }

  return (
    <div className="pvx-card">
      <div className="pvx-card-header--split">
        <div>
          <h4 className="pvx-card-title">
            {heading || leaderboard.track || config?.name || 'Hotlap Leaderboard'}
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

/**
 * One round of a multi-round hotlap competition: that round's aggregate
 * best-lap leaderboard plus its per-cycle session sub-tabs. Same shape as the
 * single-round hotlap view, scoped to a single round. The leaderboard stays
 * live while the round runs; points only reach Standings once it closes.
 */
function HotlapRound({ competitionId, roundMeta, roundData }) {
  const { data: leaderboard } = useCompetitionRoundLeaderboard(competitionId, roundMeta.roundNumber)
  const sessions = roundData?.sessions || []
  const [activeSub, setActiveSub] = useState('leaderboard')

  const subTabs = [
    { id: 'leaderboard', label: 'Leaderboard' },
    ...sessions.map((s) => ({ id: `session-${s.type}`, label: formatSessionLabel(s.type) })),
  ]
  // Guard against a stale selection if the round's session list changes.
  const effectiveSub = subTabs.some((t) => t.id === activeSub) ? activeSub : 'leaderboard'
  const heading = `Round ${roundMeta.roundNumber}${roundMeta.track ? ` — ${roundMeta.track}` : ''}`

  return (
    <div>
      <div className="pvx-session-tabs">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSub(t.id)}
            className={`pvx-session-tab ${effectiveSub === t.id ? 'pvx-session-tab--active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {effectiveSub === 'leaderboard' ? (
        <HotlapLeaderboard leaderboard={leaderboard} heading={heading} />
      ) : (
        <HotlapSessionContent
          session={sessions.find((s) => `session-${s.type}` === effectiveSub)}
          round={roundData}
          competitionId={competitionId}
        />
      )}
    </div>
  )
}
