import { useMemo } from 'react'
import { formatLapTime, formatCarName, formatDate } from '../../utils/format.js'
import {
  useSortConfig, sortEntries, useTagFilter, matchesTagFilter,
  SortTh, DriverCell, TagFilterBar, EmptyState, LoadingState,
} from './shared.jsx'

/**
 * Layer 1: Track Records table.
 *
 * @param {object} props
 * @param {Array} props.tracks - Transformed track objects from useLeaderboardIndex
 * @param {boolean} props.isLoading
 * @param {object} props.carMetadata - From useCarMetadata
 * @param {Function} props.getUserDisplay - From useUserLookup
 * @param {(trackId: string, layout: string|null) => void} props.onTrackSelect
 */
export function TracksTable({ tracks, isLoading, carMetadata, getUserDisplay, onTrackSelect }) {
  const [sortConfig, onSort] = useSortConfig({ key: 'record.timestamp', dir: 'desc' })
  const { activeTags, toggle, clear } = useTagFilter()

  const availableTags = useMemo(() => {
    if (!carMetadata?.tags?.length) return []
    const present = new Set()
    for (const t of tracks || []) {
      if (t.recordByTag) Object.keys(t.recordByTag).forEach((tag) => present.add(tag))
    }
    return carMetadata.tags.filter((t) => present.has(t))
  }, [tracks, carMetadata])

  const filtered = useMemo(() => {
    if (!tracks) return []
    if (activeTags.size === 0) return tracks
    return tracks
      .map((track) => {
        if (!track.recordByTag) return null
        let best = null
        const seen = new Set()
        for (const rec of Object.values(track.recordByTag)) {
          if (seen.has(rec.carId)) continue
          seen.add(rec.carId)
          const tags = carMetadata?.cars?.[rec.carId]?.tags || ['sports_car']
          if (!matchesTagFilter(tags, activeTags)) continue
          if (!best || rec.lapTimeMs < best.lapTimeMs) best = rec
        }
        if (!best) return null
        return {
          ...track,
          record: {
            visibleId: best.steamId || best.identifier,
            carId: best.carId,
            carDisplayName: formatCarName(best.carId),
            lapTimeMs: best.lapTimeMs,
            timestamp: best.recordedAt,
          },
        }
      })
      .filter(Boolean)
  }, [tracks, activeTags, carMetadata])

  const sorted = useMemo(() => {
    return sortEntries(filtered, sortConfig, (t, key) => {
      switch (key) {
        case 'displayName': return t.displayName
        case 'record.lapTimeMs': return t.record?.lapTimeMs
        case 'driverCount': return t.driverCount || 0
        case 'carCount': return t.carCount || 0
        case 'record.timestamp': default: return t.record?.timestamp ? new Date(t.record.timestamp).getTime() : 0
      }
    })
  }, [filtered, sortConfig])

  if (isLoading) return <LoadingState />
  if (!tracks?.length) return <EmptyState message="No lap times recorded yet." />

  return (
    <div className="pvx-card">
      <div className="pvx-card-header">
        <h2 className="pvx-card-title">Track Records</h2>
      </div>
      <TagFilterBar availableTags={availableTags} activeTags={activeTags} onToggle={toggle} onClear={clear} />
      <div className="pvx-table-scroll">
        <table className="pvx-table">
          <thead>
            <tr className="pvx-thead-row">
              <SortTh label="Track" sortKey="displayName" config={sortConfig} onSort={onSort} />
              <th className="pvx-th">Record Holder</th>
              <th className="pvx-th pvx-hidden-below-lg">Car</th>
              <SortTh label="Lap Time" sortKey="record.lapTimeMs" config={sortConfig} onSort={onSort} />
              <SortTh label="Drivers" sortKey="driverCount" config={sortConfig} onSort={onSort} className="pvx-hidden-below-md" />
              <SortTh label="Cars" sortKey="carCount" config={sortConfig} onSort={onSort} className="pvx-hidden-below-lg" />
              <SortTh label="Date" sortKey="record.timestamp" config={sortConfig} onSort={onSort} className="pvx-hidden-below-xl" />
            </tr>
          </thead>
          <tbody className="pvx-tbody">
            {sorted.map((track) => (
              <tr
                key={`${track.id}|${track.layout || ''}`}
                className="pvx-row pvx-row--clickable"
                onClick={() => onTrackSelect(track.id, track.layout)}
              >
                <td className="pvx-td pvx-td--primary">{track.displayName}</td>
                <td className="pvx-td">
                  {track.record?.visibleId
                    ? <DriverCell userId={track.record.visibleId} getUserDisplay={getUserDisplay} />
                    : '-'}
                </td>
                <td className="pvx-td pvx-hidden-below-lg">{track.record?.carDisplayName || '-'}</td>
                <td className="pvx-td pvx-td--primary pvx-td--mono">{track.record ? formatLapTime(track.record.lapTimeMs) : '-'}</td>
                <td className="pvx-td pvx-td--center pvx-hidden-below-md">{track.driverCount || '-'}</td>
                <td className="pvx-td pvx-td--center pvx-hidden-below-lg">{track.carCount || '-'}</td>
                <td className="pvx-td pvx-td--muted pvx-hidden-below-xl">{track.record?.timestamp ? formatDate(track.record.timestamp) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
