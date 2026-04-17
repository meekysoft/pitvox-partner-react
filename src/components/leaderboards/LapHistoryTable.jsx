import { useMemo } from 'react'
import { formatLapTime, formatSectorTime, formatCarName, formatDate, formatTyreCompound, formatFuel } from '../../utils/format.js'
import { useDriverLaps } from '../../hooks/useLeaderboards.js'
import { calcBestSectors, Breadcrumb, EmptyState, LoadingState, CheckIcon, CrossIcon } from './shared.jsx'

/**
 * Layer 4: Driver lap history for a specific track/car combination.
 *
 * @param {object} props
 * @param {string} props.userId
 * @param {object} props.track - { id, layout, displayName }
 * @param {string} props.carId
 * @param {string} [props.game]
 * @param {string} [props.gameVersion]
 * @param {boolean} props.showInvalid
 * @param {Function} props.getUserDisplay - From useUserLookup
 * @param {() => void} props.onToggleInvalid
 * @param {(layer: string) => void} props.onNavigate
 */
export function LapHistoryTable({ userId, track, carId, game, gameVersion, showInvalid, getUserDisplay, onToggleInvalid, onNavigate }) {
  const { data: laps, driverName, theoreticalBest, isLoading } = useDriverLaps(userId, track.id, track.layout, carId, { showInvalid, game, gameVersion })
  const { displayName, avatarUrl } = getUserDisplay(userId, driverName)

  const bestSectors = useMemo(() => calcBestSectors(laps, true), [laps])

  const bestLapTime = useMemo(() => {
    const valid = laps?.filter((l) => l.isValid) || []
    return valid.length ? Math.min(...valid.map((l) => l.lapTimeMs)) : null
  }, [laps])

  const crumbs = [
    { key: 'tracks', label: 'Tracks', onClick: () => onNavigate('tracks') },
    { key: 'track', label: track.displayName, onClick: () => onNavigate('track') },
    { key: 'car', label: formatCarName(carId), onClick: () => onNavigate('car') },
    { key: 'driver', label: displayName },
  ]

  if (isLoading) return <LoadingState />

  return (
    <div className="pvx-card">
      <div className="pvx-card-header pvx-card-header--split">
        <div className="pvx-card-header-left">
          <Breadcrumb segments={crumbs} />
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="pvx-driver-avatar pvx-driver-avatar--lg" />
          ) : (
            <span className="pvx-driver-avatar pvx-driver-avatar--lg pvx-driver-avatar--placeholder" />
          )}
        </div>
        <label className="pvx-checkbox-label">
          <input
            type="checkbox"
            checked={showInvalid}
            onChange={onToggleInvalid}
            className="pvx-checkbox"
          />
          <span>Show invalid laps</span>
        </label>
      </div>
      {theoreticalBest && (
        <div className="pvx-theoretical-best">
          <span className="pvx-theoretical-best-label">Theoretical Best:</span>
          <span className="pvx-theoretical-best-time">{formatLapTime(theoreticalBest.lapTimeMs)}</span>
          <span className="pvx-theoretical-best-sectors">
            ({formatSectorTime(theoreticalBest.sector1Ms)} + {formatSectorTime(theoreticalBest.sector2Ms)} + {formatSectorTime(theoreticalBest.sector3Ms)})
          </span>
        </div>
      )}
      {!laps?.length ? (
        <EmptyState message={showInvalid ? 'No laps recorded for this combination.' : 'No valid laps. Try enabling "Show invalid laps".'} />
      ) : (
        <div className="pvx-table-scroll">
          <table className="pvx-table">
            <thead>
              <tr className="pvx-thead-row">
                <th className="pvx-th pvx-th--narrow">#</th>
                <th className="pvx-th pvx-hidden-below-md">Lap</th>
                <th className="pvx-th">Lap Time</th>
                <th className="pvx-th pvx-hidden-below-sm">S1</th>
                <th className="pvx-th pvx-hidden-below-sm">S2</th>
                <th className="pvx-th pvx-hidden-below-sm">S3</th>
                <th className="pvx-th pvx-th--narrow">Valid</th>
                <th className="pvx-th pvx-hidden-below-lg">Tyre</th>
                <th className="pvx-th pvx-hidden-below-lg">Fuel</th>
                <th className="pvx-th pvx-hidden-below-xl">Date</th>
              </tr>
            </thead>
            <tbody className="pvx-tbody">
              {laps.map((lap, i) => {
                const isPB = lap.isValid && lap.lapTimeMs === bestLapTime
                const isBestS1 = bestSectors && lap.isValid && lap.sector1Ms === bestSectors.s1
                const isBestS2 = bestSectors && lap.isValid && lap.sector2Ms === bestSectors.s2
                const isBestS3 = bestSectors && lap.isValid && lap.sector3Ms === bestSectors.s3

                let rowClass = 'pvx-row'
                if (!lap.isValid) rowClass += ' pvx-row--invalid'
                if (isPB) rowClass += ' pvx-row--personal-best'

                return (
                  <tr key={lap.id} className={rowClass}>
                    <td className="pvx-td">
                      <span className={`pvx-rank ${isPB ? 'pvx-rank--gold' : ''}`}>{i + 1}</span>
                    </td>
                    <td className="pvx-td pvx-td--muted pvx-hidden-below-md">{lap.lapNumber || '-'}</td>
                    <td className="pvx-td pvx-td--primary pvx-td--mono">{formatLapTime(lap.lapTimeMs)}</td>
                    <td className={`pvx-td pvx-td--mono pvx-td--sector pvx-hidden-below-sm ${isBestS1 ? 'pvx-td--best-sector' : ''}`}>{formatSectorTime(lap.sector1Ms)}</td>
                    <td className={`pvx-td pvx-td--mono pvx-td--sector pvx-hidden-below-sm ${isBestS2 ? 'pvx-td--best-sector' : ''}`}>{formatSectorTime(lap.sector2Ms)}</td>
                    <td className={`pvx-td pvx-td--mono pvx-td--sector pvx-hidden-below-sm ${isBestS3 ? 'pvx-td--best-sector' : ''}`}>{formatSectorTime(lap.sector3Ms)}</td>
                    <td className="pvx-td" title={!lap.isValid ? (lap.invalidReason || 'Invalid') : undefined}>
                      {lap.isValid ? <CheckIcon /> : <CrossIcon />}
                    </td>
                    <td className="pvx-td pvx-td--center pvx-hidden-below-lg" title={formatTyreCompound(lap.tyreCompound)}>{lap.tyreCompound || '-'}</td>
                    <td className="pvx-td pvx-td--center pvx-hidden-below-lg">{formatFuel(lap.startingFuelL)}</td>
                    <td className="pvx-td pvx-td--muted pvx-hidden-below-xl">{formatDate(lap.timestamp)}</td>
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
