/**
 * Styled entry list (registered drivers) for a competition.
 * Displays a grid of driver cards with avatar and display name.
 *
 * @param {object} props
 * @param {string} props.competitionId
 * @param {string} [props.className] - Additional class on root container
 */

import { useCompetitionEntryList } from '../../hooks/useCompetitions.js'
import { CompLoadingState, CompEmptyState } from './shared.jsx'

export function EntryList({ competitionId, className }) {
  const { data: entryList, isLoading } = useCompetitionEntryList(competitionId)

  if (isLoading) {
    return <CompLoadingState message="Loading drivers..." />
  }

  const drivers = entryList?.drivers || entryList?.entries || []

  if (!drivers.length) {
    return <CompEmptyState message="No drivers registered yet." />
  }

  return (
    <div className={`pvx-entry-grid ${className || ''}`}>
      {drivers.map((driver) => (
        <div key={driver.steamId || driver.driverId} className="pvx-entry-card">
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
          <span className="pvx-entry-name">{driver.displayName}</span>
        </div>
      ))}
    </div>
  )
}
