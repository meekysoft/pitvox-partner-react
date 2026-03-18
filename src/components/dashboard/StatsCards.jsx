/**
 * Stats cards row — Total Laps, Cars Driven, Tracks Driven, Records Held, Best Ranking, Driver Rating.
 * Only renders cards for data that is available.
 *
 * @param {object} props
 * @param {object} props.stats - From useDriverStats().data
 * @param {object} [props.rating] - From useDriverRating().data
 * @param {string} [props.className]
 */
export function StatsCards({ stats, rating, className = '' }) {
  const cards = []

  if (stats) {
    cards.push({ label: 'Total Laps', value: stats.lapCount.toLocaleString() })
    cards.push({ label: 'Cars Driven', value: stats.carBreakdown.length })
    cards.push({ label: 'Tracks Driven', value: stats.trackBreakdown.length })
    cards.push({ label: 'Records Held', value: stats.recordsHeld })

    if (stats.bestRanking != null) {
      cards.push({ label: 'Best Ranking', value: `#${stats.bestRanking}` })
    }
  }

  if (rating) {
    cards.push({
      label: 'Driver Rating',
      value: rating.rating.toFixed(1),
      sub: `#${rating.rank} of ${rating.totalDrivers}`,
    })
  }

  if (!cards.length) return null

  return (
    <div className={`pvx-dash-stats ${className}`}>
      {cards.map((card) => (
        <div key={card.label} className="pvx-dash-stat-card">
          <span className="pvx-dash-stat-value">{card.value}</span>
          <span className="pvx-dash-stat-label">{card.label}</span>
          {card.sub && <span className="pvx-dash-stat-sub">{card.sub}</span>}
        </div>
      ))}
    </div>
  )
}
