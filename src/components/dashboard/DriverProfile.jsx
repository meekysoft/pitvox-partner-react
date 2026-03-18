/**
 * Driver profile card — avatar, name, and member-since date.
 *
 * @param {object} props
 * @param {string} props.driverName
 * @param {string} [props.avatarUrl]
 * @param {string} [props.memberSince] - ISO date string
 * @param {string} [props.className]
 */
export function DriverProfile({ driverName, avatarUrl, memberSince, className = '' }) {
  const since = memberSince
    ? new Date(memberSince).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  return (
    <div className={`pvx-card pvx-dash-profile ${className}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="pvx-dash-profile-avatar" />
      ) : (
        <div className="pvx-dash-profile-avatar pvx-dash-profile-avatar--placeholder">
          {(driverName || '?')[0].toUpperCase()}
        </div>
      )}
      <div className="pvx-dash-profile-info">
        <h2 className="pvx-dash-profile-name">{driverName}</h2>
        {since && <p className="pvx-dash-profile-since">Racing since {since}</p>}
      </div>
    </div>
  )
}
