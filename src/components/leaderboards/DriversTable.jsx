import { useMemo } from 'react'
import { formatLapTime, formatSectorTime, formatCarName, formatDate, formatTyreCompound } from '../../utils/format.js'
import {
  useSortConfig, sortEntries, calcBestSectors,
  SortTh, DriverCell, RankBadge, Breadcrumb, EmptyState, LoadingState,
} from './shared.jsx'

/**
 * Layer 3: Drivers for a specific car — all drivers' best laps with sector detail.
 *
 * @param {object} props
 * @param {Array} props.entries - Driver entries from useTrackLeaderboard with carId filter
 * @param {boolean} props.isLoading
 * @param {object} props.track - { id, layout, displayName }
 * @param {string} props.carId
 * @param {Function} props.getUserDisplay - From useUserLookup
 * @param {(userId: string) => void} props.onDriverSelect
 * @param {(layer: string) => void} props.onNavigate
 */
export function DriversTable({ entries, isLoading, track, carId, getUserDisplay, onDriverSelect, onNavigate }) {
  const [sortConfig, onSort] = useSortConfig({ key: 'lapTimeMs', dir: 'asc' })

  const bestSectors = useMemo(() => calcBestSectors(entries), [entries])

  const sorted = useMemo(() => {
    return sortEntries(entries || [], sortConfig, (e, key) => {
      switch (key) {
        case 'userId': return getUserDisplay(e.steamId || e.userId).displayName
        case 'lapCount': return e.lapCount || 0
        case 'lapTimeMs': default: return e.lapTimeMs
      }
    })
  }, [entries, sortConfig, getUserDisplay])

  const crumbs = [
    { key: 'tracks', label: 'Tracks', onClick: () => onNavigate('tracks') },
    { key: 'track', label: track.displayName, onClick: () => onNavigate('track') },
    { key: 'car', label: formatCarName(carId) },
  ]

  if (isLoading) return <LoadingState />

  return (
    <div className="pvx-card">
      <div className="pvx-card-header">
        <Breadcrumb segments={crumbs} />
      </div>
      {!entries?.length ? (
        <EmptyState message="No lap times for this car yet." />
      ) : (
        <div className="pvx-table-scroll">
          <table className="pvx-table">
            <thead>
              <tr className="pvx-thead-row">
                <th className="pvx-th pvx-th--narrow">#</th>
                <SortTh label="Driver" sortKey="userId" config={sortConfig} onSort={onSort} />
                <SortTh label="Lap Time" sortKey="lapTimeMs" config={sortConfig} onSort={onSort} />
                <th className="pvx-th pvx-hidden-below-sm">S1</th>
                <th className="pvx-th pvx-hidden-below-sm">S2</th>
                <th className="pvx-th pvx-hidden-below-sm">S3</th>
                <th className="pvx-th pvx-hidden-below-lg">Tyre</th>
                <th className="pvx-th pvx-hidden-below-xl">Fuel</th>
                <SortTh label="Laps" sortKey="lapCount" config={sortConfig} onSort={onSort} className="pvx-hidden-below-lg" />
                <th className="pvx-th pvx-hidden-below-xl">Date</th>
              </tr>
            </thead>
            <tbody className="pvx-tbody">
              {sorted.map((entry, i) => {
                const rank = i + 1
                const visibleId = entry.steamId || entry.userId
                const isBestS1 = bestSectors && entry.sector1Ms === bestSectors.s1
                const isBestS2 = bestSectors && entry.sector2Ms === bestSectors.s2
                const isBestS3 = bestSectors && entry.sector3Ms === bestSectors.s3

                return (
                  <tr
                    key={visibleId}
                    className={`pvx-row pvx-row--clickable ${rank <= 3 ? 'pvx-row--podium' : ''}`}
                    onClick={() => onDriverSelect(visibleId)}
                  >
                    <td className="pvx-td"><RankBadge rank={rank} podium /></td>
                    <td className="pvx-td pvx-td--primary"><DriverCell userId={visibleId} getUserDisplay={getUserDisplay} /></td>
                    <td className="pvx-td pvx-td--primary pvx-td--mono">{formatLapTime(entry.lapTimeMs)}</td>
                    <td className={`pvx-td pvx-td--mono pvx-td--sector pvx-hidden-below-sm ${isBestS1 ? 'pvx-td--best-sector' : ''}`}>{formatSectorTime(entry.sector1Ms)}</td>
                    <td className={`pvx-td pvx-td--mono pvx-td--sector pvx-hidden-below-sm ${isBestS2 ? 'pvx-td--best-sector' : ''}`}>{formatSectorTime(entry.sector2Ms)}</td>
                    <td className={`pvx-td pvx-td--mono pvx-td--sector pvx-hidden-below-sm ${isBestS3 ? 'pvx-td--best-sector' : ''}`}>{formatSectorTime(entry.sector3Ms)}</td>
                    <td className="pvx-td pvx-td--center pvx-hidden-below-lg" title={formatTyreCompound(entry.tyreCompound)}>{entry.tyreCompound || '-'}</td>
                    <td className="pvx-td pvx-td--center pvx-hidden-below-xl">{entry.startingFuelL ? `${entry.startingFuelL}L` : '-'}</td>
                    <td className="pvx-td pvx-td--center pvx-hidden-below-lg">{entry.lapCount || '-'}</td>
                    <td className="pvx-td pvx-td--muted pvx-hidden-below-xl">{entry.recordedAt ? formatDate(entry.recordedAt) : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
