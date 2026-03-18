import { formatLapTime, formatCarName, formatTrackName } from '../../utils/format.js'

/**
 * Table of current records held by a driver.
 *
 * @param {object} props
 * @param {Array} props.records - currentRecords array from useDriverStats().data
 * @param {string} [props.className]
 */
export function RecordsTable({ records, className = '' }) {
  if (!records?.length) return null

  return (
    <div className={`pvx-card ${className}`}>
      <div className="pvx-card-header">
        <h3 className="pvx-card-title">Current Records</h3>
      </div>
      <div className="pvx-table-scroll">
        <table className="pvx-table">
          <thead>
            <tr className="pvx-thead-row">
              <th className="pvx-th">Track</th>
              <th className="pvx-th">Car</th>
              <th className="pvx-th">Lap Time</th>
              <th className="pvx-th pvx-hidden-below-sm">Game</th>
            </tr>
          </thead>
          <tbody className="pvx-tbody">
            {records.map((record, i) => (
              <tr key={i} className="pvx-row">
                <td className="pvx-td pvx-td--primary">
                  {formatTrackName(record.trackId, record.layout, record.game)}
                </td>
                <td className="pvx-td">{formatCarName(record.carId)}</td>
                <td className="pvx-td pvx-td--mono">{formatLapTime(record.lapTimeMs)}</td>
                <td className="pvx-td pvx-hidden-below-sm">
                  <span className={`pvx-dash-game-badge pvx-dash-game-badge--${record.game || 'evo'}`}>
                    {(record.game || 'evo').toUpperCase()}
                    {record.gameVersion ? ` ${record.gameVersion}` : ''}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
