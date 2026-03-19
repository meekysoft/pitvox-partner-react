import { useMemo } from 'react'
import { formatLapTime, formatCarName, formatDate } from '../../utils/format.js'
import {
  useSortConfig, sortEntries, useTagFilter, matchesTagFilter,
  SortTh, DriverCell, RankBadge, TagFilterBar, Breadcrumb, EmptyState, LoadingState,
} from './shared.jsx'

/**
 * Layer 2: Cars for a track — record holder per car.
 *
 * @param {object} props
 * @param {Array} props.entries - Car-level entries from useTrackLeaderboard (no carId filter)
 * @param {boolean} props.isLoading
 * @param {object} props.track - { id, layout, displayName }
 * @param {object} props.carMetadata - From useCarMetadata
 * @param {Function} props.getUserDisplay - From useUserLookup
 * @param {(carId: string) => void} props.onCarSelect
 * @param {(layer: string) => void} props.onNavigate - Breadcrumb navigation
 */
export function CarsTable({ entries, isLoading, track, carMetadata, getUserDisplay, onCarSelect, onNavigate, tags, onTagChange }) {
  const [sortConfig, onSort] = useSortConfig({ key: 'lapTimeMs', dir: 'asc' })
  const { activeTags, toggle, clear } = useTagFilter(tags, onTagChange)

  const availableTags = useMemo(() => {
    if (!entries || !carMetadata?.tags?.length) return []
    const present = new Set()
    for (const e of entries) {
      const tags = carMetadata.cars?.[e.carId]?.tags || ['sports_car']
      tags.forEach((t) => present.add(t))
    }
    return carMetadata.tags.filter((t) => present.has(t))
  }, [entries, carMetadata])

  const filtered = useMemo(() => {
    if (!entries) return []
    if (activeTags.size === 0) return entries
    return entries.filter((e) => {
      const tags = carMetadata?.cars?.[e.carId]?.tags || ['sports_car']
      return matchesTagFilter(tags, activeTags)
    })
  }, [entries, activeTags, carMetadata])

  const sorted = useMemo(() => {
    return sortEntries(filtered, sortConfig, (e, key) => {
      switch (key) {
        case 'carId': return formatCarName(e.carId)
        case 'driverCount': return e.driverCount || 0
        case 'lapTimeMs': default: return e.lapTimeMs
      }
    })
  }, [filtered, sortConfig])

  const crumbs = [
    { key: 'tracks', label: 'Tracks', onClick: () => onNavigate('tracks') },
    { key: 'track', label: track.displayName },
  ]

  if (isLoading) return <LoadingState />

  return (
    <div className="pvx-card">
      <div className="pvx-card-header">
        <Breadcrumb segments={crumbs} />
      </div>
      <TagFilterBar availableTags={availableTags} activeTags={activeTags} onToggle={toggle} onClear={clear} />
      {!entries?.length ? (
        <EmptyState message="No lap times for this track yet." />
      ) : (
        <div className="pvx-table-scroll">
          <table className="pvx-table">
            <thead>
              <tr className="pvx-thead-row">
                <th className="pvx-th pvx-th--narrow">#</th>
                <SortTh label="Car" sortKey="carId" config={sortConfig} onSort={onSort} />
                <th className="pvx-th">Record Holder</th>
                <SortTh label="Lap Time" sortKey="lapTimeMs" config={sortConfig} onSort={onSort} />
                <SortTh label="Drivers" sortKey="driverCount" config={sortConfig} onSort={onSort} className="pvx-hidden-below-md" />
                <th className="pvx-th pvx-hidden-below-lg">Date</th>
              </tr>
            </thead>
            <tbody className="pvx-tbody">
              {sorted.map((entry, i) => (
                <tr
                  key={entry.carId}
                  className="pvx-row pvx-row--clickable"
                  onClick={() => onCarSelect(entry.carId)}
                >
                  <td className="pvx-td"><RankBadge rank={i + 1} podium /></td>
                  <td className="pvx-td pvx-td--primary">{formatCarName(entry.carId)}</td>
                  <td className="pvx-td"><DriverCell userId={entry.steamId || entry.userId} getUserDisplay={getUserDisplay} /></td>
                  <td className="pvx-td pvx-td--primary pvx-td--mono">{formatLapTime(entry.lapTimeMs)}</td>
                  <td className="pvx-td pvx-td--center pvx-hidden-below-md">{entry.driverCount || '-'}</td>
                  <td className="pvx-td pvx-td--muted pvx-hidden-below-lg">{entry.recordedAt ? formatDate(entry.recordedAt) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
