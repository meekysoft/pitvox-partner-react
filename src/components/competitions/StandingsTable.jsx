/**
 * Styled championship standings table.
 * Shows position, driver (with nation flag), wins, podiums, per-round results,
 * and total points. Supports dropped round styling and podium row highlighting.
 *
 * @param {object} props
 * @param {string} props.competitionId
 * @param {string} [props.className] - Additional class on root container
 */

import { useCompetitionStandings, useCompetitionConfig } from '../../hooks/useCompetitions.js'
import { CompRankBadge, NationFlag, CompLoadingState, CompEmptyState } from './shared.jsx'

export function StandingsTable({ competitionId, className }) {
  const { data: standings, isLoading: loadingStandings } = useCompetitionStandings(competitionId)
  const { data: config, isLoading: loadingConfig } = useCompetitionConfig(competitionId)

  if (loadingStandings || loadingConfig) {
    return <CompLoadingState message="Loading standings..." />
  }

  if (!standings?.standings?.length) {
    return <CompEmptyState message="No standings data yet. Results will appear once rounds are finalised." />
  }

  const finalizedRounds = config?.rounds?.filter((r) => r.isFinalized) || []

  return (
    <div className={`pvx-card ${className || ''}`}>
      <div className="pvx-card-header--split">
        <div className="pvx-card-header-left">
          <h3 className="pvx-card-title">Championship Standings</h3>
          <span className="pvx-standings-subtitle">
            After {standings.roundsCompleted} round{standings.roundsCompleted !== 1 ? 's' : ''}
            {standings.countingRounds > 0 && ` (best ${standings.countingRounds} count)`}
          </span>
        </div>
      </div>

      <div className="pvx-table-scroll">
        <table className="pvx-table">
          <thead>
            <tr className="pvx-thead-row">
              <th className="pvx-th pvx-th--narrow">Pos</th>
              <th className="pvx-th">Driver</th>
              <th className="pvx-th pvx-th--center pvx-hidden-below-sm">W</th>
              <th className="pvx-th pvx-th--center pvx-hidden-below-sm">Pod</th>
              <th className="pvx-th pvx-th--center">Points</th>
              {finalizedRounds.map((r) => (
                <th
                  key={r.roundNumber}
                  className="pvx-th pvx-th--center pvx-hidden-below-md"
                  title={r.track || `Round ${r.roundNumber}`}
                >
                  R{r.roundNumber}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="pvx-tbody">
            {standings.standings.map((driver) => (
              <StandingsRow
                key={driver.driverId || driver.driverName}
                driver={driver}
                finalizedRounds={finalizedRounds}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StandingsRow({ driver, finalizedRounds }) {
  const isTopThree = driver.position <= 3
  const roundResultMap = new Map(
    driver.roundResults?.map((r) => [r.roundNumber, r]) || []
  )
  const wins = driver.roundResults?.filter((r) => r.position === 1).length || 0
  const podiums = driver.roundResults?.filter((r) => r.position <= 3).length || 0

  return (
    <tr className={`pvx-row ${isTopThree ? 'pvx-row--podium' : ''}`}>
      <td className="pvx-td">
        <CompRankBadge position={driver.position} />
      </td>
      <td className="pvx-td pvx-td--primary">
        <NationFlag nation={driver.nation} />
        {driver.driverName}
      </td>
      <td className="pvx-td pvx-td--center pvx-hidden-below-sm">{wins || '-'}</td>
      <td className="pvx-td pvx-td--center pvx-hidden-below-sm">{podiums || '-'}</td>
      <td className="pvx-td pvx-td--center pvx-standings-total">{driver.totalPoints}</td>
      {finalizedRounds.map((r) => {
        const result = roundResultMap.get(r.roundNumber)
        const isDropped = result?.dropped

        return (
          <td
            key={r.roundNumber}
            className={`pvx-td pvx-td--center pvx-hidden-below-md ${
              !isDropped && result?.position <= 3 ? 'pvx-standings-cell--podium' : ''
            }`}
          >
            {result ? (
              <div className={`pvx-standings-round-cell ${isDropped ? 'pvx-standings-round-cell--dropped' : ''}`}>
                <span className="pvx-standings-round-pos">P{result.position}</span>
                <span className="pvx-standings-round-pts">{result.points}</span>
              </div>
            ) : (
              <span className="pvx-td--muted">-</span>
            )}
          </td>
        )
      })}
    </tr>
  )
}
