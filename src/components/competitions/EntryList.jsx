/**
 * Styled entry list (registered drivers) for a competition.
 * Displays a grid of driver cards with avatar and display name.
 *
 * @param {object} props
 * @param {string} props.competitionId
 * @param {string} [props.className] - Additional class on root container
 */

import { usePitVox } from '../../provider.jsx'
import { useCompetitionEntryList } from '../../hooks/useCompetitions.js'
import { CompLoadingState, CompEmptyState } from './shared.jsx'

export function EntryList({ competitionId, className }) {
  const { getSteamId } = usePitVox()
  const { data: entryList, isLoading } = useCompetitionEntryList(competitionId)
  const steamId = getSteamId()

  if (isLoading) {
    return <CompLoadingState message="Loading drivers..." />
  }

  const drivers = entryList?.drivers || entryList?.entries || []

  if (!drivers.length) {
    return <CompEmptyState message="No drivers registered yet." />
  }

  return (
    <div className={`pvx-entry-grid ${className || ''}`}>
      {drivers.map((driver) => {
        const isCurrentUser = steamId && (driver.steamId === steamId)
        return (
          <div key={driver.steamId || driver.driverId} className={`pvx-entry-card ${isCurrentUser ? 'pvx-entry-card--you' : ''}`}>
            {driver.avatarUrl ? (
              <img
                src={driver.avatarUrl}
                alt=""
                className="pvx-entry-avatar"
              />
            ) : (
              <div className="pvx-entry-avatar pvx-entry-avatar--placeholder">
                {driver.displayName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <span className="pvx-entry-name">
              {driver.displayName}
              {isCurrentUser && <span className="pvx-entry-you"> (you)</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}
