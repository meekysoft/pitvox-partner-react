/**
 * CompletedBadge — surfaces the podium winners for a completed championship.
 * Fetches standings via useCompetitionStandings and renders medal + driver
 * name for the top N finishers.
 *
 * @param {object} props
 * @param {string} props.competitionId - Competition UUID
 * @param {number} [props.topN=3] - Number of podium positions to show
 * @param {string} [props.label='Completed'] - Header label shown above the podium
 * @param {string} [props.className] - Additional class applied to the root element
 */

import { useCompetitionStandings } from '../../hooks/useCompetitions.js'
import { NationFlag, PODIUM_MEDALS, getCompetitionPodium } from './shared.jsx'

export function CompletedBadge({ competitionId, topN = 3, label = 'Completed', className }) {
  const { data: standings } = useCompetitionStandings(competitionId)
  const podium = getCompetitionPodium(standings, topN)

  return (
    <div className={`pvx-comp-completed-badge ${className || ''}`}>
      <span className="pvx-comp-completed-badge-label">{label}</span>
      {podium.length > 0 && (
        <ol className="pvx-comp-completed-badge-podium">
          {podium.map((d, i) => (
            <li key={d.driverId || i} className="pvx-comp-completed-badge-driver">
              <span className="pvx-comp-completed-badge-medal" aria-hidden="true">
                {PODIUM_MEDALS[i] || ''}
              </span>
              <NationFlag nation={d.nation} />
              <span className="pvx-comp-completed-badge-name">{d.driverName}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
