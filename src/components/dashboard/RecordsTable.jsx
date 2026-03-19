import { useMemo } from 'react'
import { formatLapTime, formatCarName, formatTrackName } from '../../utils/format.js'

/**
 * Compact records list — track name bold, car below, time + game badge right-aligned.
 * Sorted by most recent first. Scrollable list.
 *
 * @param {object} props
 * @param {Array} props.records - currentRecords array from useDriverStats().data
 * @param {string} [props.className]
 */
export function RecordsTable({ records, className = '' }) {
  const sorted = useMemo(() => {
    if (!records?.length) return []
    return records.slice().sort((a, b) => {
      const dateA = a.recordedAt ? new Date(a.recordedAt).getTime() : 0
      const dateB = b.recordedAt ? new Date(b.recordedAt).getTime() : 0
      return dateB - dateA
    })
  }, [records])

  if (!sorted.length) return null

  return (
    <div className={`pvx-card ${className}`}>
      <div className="pvx-card-header">
        <h3 className="pvx-card-title">
          <span className="pvx-dash-records-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
              <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
              <path d="M18 2H6v7a6 6 0 0012 0V2z" />
            </svg>
          </span>
          Current Records
          <span className="pvx-dash-records-count">({sorted.length})</span>
        </h3>
      </div>
      <div className="pvx-dash-records-list">
        {sorted.map((record, i) => (
          <div key={i} className="pvx-dash-record-row">
            <div className="pvx-dash-record-info">
              <span className="pvx-dash-record-track">
                {formatTrackName(record.trackId, record.layout, record.game)}
              </span>
              <span className="pvx-dash-record-car">
                {formatCarName(record.carId)}
              </span>
            </div>
            <div className="pvx-dash-record-time">
              <span className="pvx-dash-record-lap">{formatLapTime(record.lapTimeMs)}</span>
              <span className={`pvx-dash-game-badge pvx-dash-game-badge--${record.game || 'evo'}`}>
                {(record.game || 'evo').toUpperCase()}
                {record.gameVersion ? ` ${record.gameVersion}` : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
